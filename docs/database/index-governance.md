# 資料庫索引治理規範 (PERF-003)

> **版本**: 1.0 | **更新日期**: 2026-02-02

---

## 索引策略原則

1. **查詢優先**: 只為高頻查詢建立索引
2. **覆蓋索引**: 優先建立覆蓋索引減少回表
3. **組合索引**: 遵循最左前綴原則
4. **定期審計**: 每季度審視索引使用率

---

## 現有高頻查詢分析

| 查詢 | 預估 QPS | 當前時間 | 目標 p95 |
|:-----|:--------:|:--------:|:--------:|
| 專案列表 (by ownerId) | 50 | ~120ms | <50ms |
| 交易列表 (by projectId + date) | 80 | ~150ms | <50ms |
| 客戶搜尋 (by name LIKE) | 30 | ~200ms | <100ms |
| 報價單 (by status + date) | 20 | ~100ms | <50ms |
| 發票 (by invoiceNumber) | 10 | ~50ms | <20ms |

---

## 建議索引清單

### Projects 表

```sql
-- 現有索引
CREATE INDEX idx_projects_owner ON projects(owner_id);

-- 建議新增
CREATE INDEX idx_projects_status_created 
  ON projects(status, created_at DESC);

CREATE INDEX idx_projects_client 
  ON projects(client_id);

-- 刪除記錄過濾
CREATE INDEX idx_projects_deleted 
  ON projects(deleted_at) WHERE deleted_at IS NULL;
```

### Transactions 表

```sql
-- 組合索引 (最常用查詢)
CREATE INDEX idx_transactions_project_date 
  ON transactions(project_id, date DESC);

-- 類型+日期範圍查詢
CREATE INDEX idx_transactions_type_date 
  ON transactions(type, date DESC);

-- 帳戶對帳查詢
CREATE INDEX idx_transactions_account_date 
  ON transactions(account_id, date DESC);
```

### Clients 表

```sql
-- 名稱搜尋 (使用 trigram 擴充)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_clients_name_trgm 
  ON clients USING gin(name gin_trgm_ops);

-- 電話搜尋
CREATE INDEX idx_clients_phone 
  ON clients(phone);
```

### Quotations 表

```sql
-- 狀態+日期篩選
CREATE INDEX idx_quotations_status_date 
  ON quotations(status, created_at DESC);

-- 客戶報價歷史
CREATE INDEX idx_quotations_client_date 
  ON quotations(client_id, created_at DESC);
```

### Invoices 表

```sql
-- 發票號碼唯一查詢
CREATE UNIQUE INDEX idx_invoices_number 
  ON invoices(invoice_number);

-- 逾期發票查詢
CREATE INDEX idx_invoices_due_status 
  ON invoices(due_date, status) 
  WHERE status NOT IN ('paid', 'void');
```

---

## Migration 腳本

```typescript
// apps/api/src/migrations/YYYYMMDD-add-performance-indexes.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1707000000000 
  implements MigrationInterface {
  
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Projects
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_status_created 
      ON projects(status, created_at DESC)
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_deleted 
      ON projects(deleted_at) WHERE deleted_at IS NULL
    `);
    
    // Transactions
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_project_date 
      ON transactions(project_id, date DESC)
    `);
    
    // Clients (with trigram)
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS pg_trgm
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_clients_name_trgm 
      ON clients USING gin(name gin_trgm_ops)
    `);
    
    // Quotations
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_quotations_status_date 
      ON quotations(status, created_at DESC)
    `);
    
    // Invoices
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_due_status 
      ON invoices(due_date, status) 
      WHERE status NOT IN ('paid', 'void')
    `);
  }
  
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_projects_status_created`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_projects_deleted`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_transactions_project_date`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_clients_name_trgm`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_quotations_status_date`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_invoices_due_status`);
  }
}
```

---

## 監控查詢

### 慢查詢日誌

```sql
-- 啟用慢查詢記錄 (>100ms)
ALTER SYSTEM SET log_min_duration_statement = 100;
SELECT pg_reload_conf();
```

### 索引使用率

```sql
SELECT 
  schemaname,
  relname AS table_name,
  indexrelname AS index_name,
  idx_scan AS times_used,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC
LIMIT 20;
```

### 未使用索引

```sql
SELECT 
  schemaname,
  relname AS table_name,
  indexrelname AS index_name,
  idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

---

## 驗收標準

| 查詢 | 目前 | 優化後 | 狀態 |
|:-----|:----:|:------:|:----:|
| 專案列表 | 120ms | <50ms | ⏳ |
| 交易列表 | 150ms | <50ms | ⏳ |
| 客戶搜尋 | 200ms | <100ms | ⏳ |
| 報價單 | 100ms | <50ms | ⏳ |
| 發票 | 50ms | <20ms | ⏳ |
