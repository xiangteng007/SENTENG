# 資料庫連線池優化 (BE-003)

> **版本**: 1.0 | **更新日期**: 2026-02-02

---

## 連線池概述

PostgreSQL 連線開銷高昂，連線池可重複使用連線，大幅提升效能。

---

## TypeORM 連線池配置

### 基本配置

```typescript
// apps/api/src/config/database.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getDatabaseConfig = (): TypeOrmModuleOptions => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    type: 'postgres',
    
    // 連線設定
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    
    // Cloud SQL Unix Socket
    extra: isProduction ? {
      socketPath: process.env.DB_HOST, // /cloudsql/project:region:instance
    } : {},
    
    // 連線池設定
    poolSize: parseInt(process.env.DB_POOL_SIZE || '10', 10),
    extra: {
      // 最大連線數
      max: isProduction ? 20 : 5,
      
      // 最小連線數 (保持的空閒連線)
      min: isProduction ? 5 : 1,
      
      // 連線閒置超時 (毫秒)
      idleTimeoutMillis: 30000, // 30 秒
      
      // 連線請求超時 (毫秒)
      connectionTimeoutMillis: 5000, // 5 秒
      
      // 聲明超時 (毫秒)
      statement_timeout: 30000, // 30 秒
      
      // 查詢超時 (毫秒)
      query_timeout: 30000, // 30 秒
      
      // 保持活動間隔
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    },
    
    // 重試設定
    retryAttempts: 3,
    retryDelay: 3000, // 3 秒
    
    // 日誌
    logging: isProduction ? ['error', 'warn'] : ['query', 'error'],
    
    // 其他
    synchronize: false, // 生產環境永遠 false
    entities: ['dist/**/*.entity.js'],
    migrations: ['dist/migrations/*.js'],
  };
};
```

---

## 環境變數

```bash
# .env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=senteng
DB_PASSWORD=<password>
DB_DATABASE=senteng_prod

# 連線池
DB_POOL_SIZE=10
DB_POOL_MIN=2
DB_POOL_MAX=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=5000

# Cloud Run (生產環境)
# DB_HOST=/cloudsql/senteng-erp-pro:asia-east1:senteng-db
```

---

## 最佳化參數

### 根據環境調整

| 環境 | Min | Max | Idle Timeout | 說明 |
|:-----|:---:|:---:|:------------:|:-----|
| 開發 | 1 | 5 | 10s | 節省資源 |
| Staging | 2 | 10 | 20s | 接近生產 |
| Production | 5 | 20 | 30s | 高並發 |

### Cloud Run 特殊考量

```typescript
// Cloud Run 每個實例並發上限建議
// max_connections = (memory / 50MB) 約略值
// 512Mi -> max 10
// 1Gi -> max 20
// 2Gi -> max 40

const poolConfig = {
  min: 2,
  max: parseInt(process.env.CLOUD_RUN_MEMORY || '512') / 50,
  idleTimeoutMillis: 600000, // 10 分鐘 (避免頻繁重建)
};
```

---

## 連線健康檢查

```typescript
// apps/api/src/common/health/database-health.service.ts
import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  constructor(private dataSource: DataSource) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // 檢查連線
      await this.dataSource.query('SELECT 1');
      
      // 取得連線池狀態
      const pool = this.dataSource.driver as any;
      const poolStats = {
        totalCount: pool?.pool?.totalCount || 0,
        idleCount: pool?.pool?.idleCount || 0,
        waitingCount: pool?.pool?.waitingCount || 0,
      };

      return this.getStatus(key, true, poolStats);
    } catch (error) {
      return this.getStatus(key, false, { error: error.message });
    }
  }
}

// Health Check Endpoint 回應
// GET /health/db
// {
//   "status": "ok",
//   "database": {
//     "status": "up",
//     "totalCount": 10,
//     "idleCount": 8,
//     "waitingCount": 0
//   }
// }
```

---

## 監控指標

### Prometheus Metrics

```typescript
// apps/api/src/common/metrics/database.metrics.ts
import { makeCounterProvider, makeGaugeProvider } from '@willsoto/nestjs-prometheus';

export const databaseMetrics = [
  makeGaugeProvider({
    name: 'db_pool_total_connections',
    help: 'Total database pool connections',
  }),
  makeGaugeProvider({
    name: 'db_pool_idle_connections',
    help: 'Idle database pool connections',
  }),
  makeGaugeProvider({
    name: 'db_pool_waiting_clients',
    help: 'Clients waiting for database connection',
  }),
  makeCounterProvider({
    name: 'db_query_total',
    help: 'Total database queries',
    labelNames: ['operation', 'entity'],
  }),
  makeHistogramProvider({
    name: 'db_query_duration_seconds',
    help: 'Database query duration in seconds',
    labelNames: ['operation', 'entity'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  }),
];
```

### 告警閾值

| 指標 | Warning | Critical | 動作 |
|:-----|:-------:|:--------:|:-----|
| idle_connections | < 2 | 0 | 擴展池大小 |
| waiting_clients | > 5 | > 10 | 擴展池大小 |
| query_duration_p95 | > 1s | > 3s | 優化查詢 |

---

## 故障排除

### 連線耗盡

```sql
-- 查看當前連線
SELECT 
  pid,
  usename,
  application_name,
  client_addr,
  state,
  query_start,
  query
FROM pg_stat_activity
WHERE datname = 'senteng_prod'
ORDER BY query_start DESC;

-- 終止閒置連線
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'senteng_prod'
  AND state = 'idle'
  AND query_start < NOW() - INTERVAL '30 minutes';
```

### 慢查詢

```sql
-- 識別慢查詢
SELECT 
  query,
  calls,
  total_time / 1000 AS total_seconds,
  mean_time / 1000 AS mean_seconds,
  rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

## 驗收標準

- [ ] 連線池大小根據環境配置
- [ ] 閒置超時設定合理
- [ ] Health Check 包含連線池狀態
- [ ] Prometheus 指標可用
- [ ] 無連線洩漏 (30 分鐘壓測)
