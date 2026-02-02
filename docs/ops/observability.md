# 觀測性規範 (DOC-002 / OPS-002)

> **版本**: 1.0 | **更新日期**: 2026-02-02

---

## 三大支柱

```
┌─────────────────────────────────────────────────────────────────┐
│                     Observability Stack                          │
├───────────────────┬───────────────────┬─────────────────────────┤
│      Logs         │     Metrics       │        Traces           │
│  Cloud Logging    │  Cloud Monitoring │     Cloud Trace         │
│  (Structured JSON)│  (Custom Metrics) │   (Distributed)         │
└───────────────────┴───────────────────┴─────────────────────────┘
```

---

## Logs (日誌)

### 結構化日誌格式
```json
{
  "timestamp": "2026-02-02T12:00:00.000Z",
  "severity": "INFO",
  "message": "User login successful",
  "logType": "SECURITY_AUDIT",
  "traceId": "abc123...",
  "spanId": "def456...",
  "userId": "user-uuid",
  "requestId": "req-uuid",
  "service": "erp-api",
  "version": "1.0.0",
  "context": {
    "method": "POST",
    "path": "/api/v1/auth/login",
    "statusCode": 200,
    "durationMs": 125
  }
}
```

### Severity 等級
| 等級 | 用途 | 範例 |
|:-----|:-----|:-----|
| DEBUG | 開發除錯 | DB 查詢、變數值 |
| INFO | 正常操作 | 請求完成、狀態變更 |
| WARNING | 潛在問題 | 慢查詢、重試 |
| ERROR | 錯誤 | 例外、失敗 |
| CRITICAL | 嚴重警報 | 服務不可用 |

### Log 類型標籤
```typescript
enum LogType {
  SECURITY_AUDIT = 'SECURITY_AUDIT',    // 安全審計
  BUSINESS_EVENT = 'BUSINESS_EVENT',    // 業務事件
  SYSTEM_EVENT = 'SYSTEM_EVENT',        // 系統事件
  PERFORMANCE = 'PERFORMANCE',          // 效能指標
  ERROR = 'ERROR',                      // 錯誤記錄
}
```

---

## Metrics (指標)

### 自訂指標
```typescript
// 請求指標
http_request_duration_seconds{method, path, status}
http_request_total{method, path, status}

// 業務指標
quotation_created_total{status}
contract_signed_total{client_type}
payment_processed_total{method, status}

// 資源指標
db_connection_pool_size{}
db_query_duration_seconds{query_type}
cache_hit_ratio{}
```

### 儀表板 Widget
1. **請求概覽**: RPS, 錯誤率, 延遲
2. **資源使用**: CPU, Memory, Connections
3. **業務指標**: 每日交易數, 報價轉換率
4. **告警狀態**: 當前告警, 歷史趨勢

---

## Traces (追蹤)

### Trace 傳播
```typescript
// 自動注入 Trace ID
@Injectable()
export class TraceMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const traceId = req.headers['x-cloud-trace-context'] 
      || `trace-${uuidv4()}`;
    
    // 注入到 AsyncLocalStorage
    context.run({ traceId }, () => next());
  }
}
```

### Span 建立
```typescript
// 關鍵操作 Span
@Span('database-query')
async findById(id: string) {
  return this.repository.findOne({ where: { id } });
}

@Span('external-api-call')
async syncToGoogle(data: any) {
  return this.googleClient.sync(data);
}
```

### Trace 關聯
```
Request → API Gateway → Auth Service → Database Query → Response
   │          │             │              │
   └── Span1 ─┴─── Span2 ───┴─── Span3 ───┴── (同一 Trace ID)
```

---

## Log-Trace 關聯

### 查詢範例
```sql
-- Cloud Logging 查詢
resource.type="cloud_run_revision"
jsonPayload.traceId="abc123..."
severity>=WARNING

-- 從 Trace 查 Log
trace="projects/senteng-erp-pro/traces/abc123..."
```

### 錯誤追蹤流程
1. 收到告警: Error Rate > 0.5%
2. Cloud Monitoring → 查看錯誤分布
3. 點擊錯誤 → 取得 Trace ID
4. Cloud Trace → 查看完整請求鏈
5. Cloud Logging → 查看詳細 Log
6. 定位問題根因

---

## 實作檢查清單

### Backend
- [x] 結構化 JSON 日誌
- [x] Request ID 注入
- [ ] Trace ID 自動傳播
- [ ] 自訂業務指標
- [ ] Span 標註關鍵操作

### Frontend
- [ ] 錯誤上報 (Sentry)
- [ ] 效能指標 (Web Vitals)
- [ ] 使用者行為追蹤

### Infrastructure
- [x] Cloud Logging 啟用
- [ ] Cloud Trace 啟用
- [ ] 自訂儀表板
- [ ] 告警政策
