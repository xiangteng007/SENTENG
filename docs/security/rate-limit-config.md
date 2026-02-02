# Rate Limit 配置規範 (SEC-005)

> **版本**: 1.0 | **更新日期**: 2026-02-02

---

## 全域配置

```typescript
// apps/api/src/app.module.ts
ThrottlerModule.forRoot([{
  name: 'short',
  ttl: 1000,   // 1 秒
  limit: 10,   // 10 請求/秒
}, {
  name: 'medium',
  ttl: 10000,  // 10 秒
  limit: 50,   // 50 請求/10秒
}, {
  name: 'long',
  ttl: 60000,  // 1 分鐘
  limit: 100,  // 100 請求/分鐘
}])
```

---

## 端點級配置

### 高敏感端點

| 端點 | TTL | Limit | 說明 |
|:-----|:----|:------|:-----|
| `POST /auth/login` | 60s | 5 | 登入嘗試 |
| `POST /auth/register` | 3600s | 3 | 註冊限制 |
| `POST /auth/reset-password` | 3600s | 3 | 密碼重設 |
| `POST /auth/verify-otp` | 60s | 3 | OTP 驗證 |

### 寫入操作

| 端點 | TTL | Limit | 說明 |
|:-----|:----|:------|:-----|
| `POST /*/` | 60s | 30 | 一般新增 |
| `PATCH /*/` | 60s | 50 | 一般更新 |
| `DELETE /*/` | 60s | 10 | 刪除操作 |

### 讀取操作

| 端點 | TTL | Limit | 說明 |
|:-----|:----|:------|:-----|
| `GET /*/` | 60s | 200 | 一般查詢 |
| `GET /*/list` | 60s | 100 | 列表查詢 |
| `GET /reports/*` | 60s | 20 | 報表生成 |

### 整合操作

| 端點 | TTL | Limit | 說明 |
|:-----|:----|:------|:-----|
| `POST /integrations/sync` | 300s | 5 | Google 同步 |
| `GET /integrations/oauth/*` | 60s | 10 | OAuth 流程 |

---

## 實作範例

```typescript
// Controller 級別
@Controller('auth')
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 5, ttl: 60000 } })
export class AuthController {
  
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() dto: LoginDto) {}
  
  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  async register(@Body() dto: RegisterDto) {}
}
```

---

## 回應格式

### 超過限制時
```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "請求過於頻繁，請稍後再試",
  "retryAfter": 45
}
```

### 回應標頭
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1706860800
Retry-After: 45
```

---

## 監控與告警

### Cloud Monitoring 查詢
```sql
-- 429 錯誤統計
SELECT
  timestamp,
  COUNT(*) as rate_limit_hits
FROM
  `senteng-erp-pro.run_requests`
WHERE
  status = 429
GROUP BY
  TIMESTAMP_TRUNC(timestamp, MINUTE)
```

### 告警閾值
| 指標 | 閾值 | 動作 |
|:-----|:-----|:-----|
| 429 > 100/min | Warning | Slack 通知 |
| 429 > 500/min | Critical | 調查攻擊 |
| 單 IP 429 > 50 | Critical | 臨時封鎖 |

---

## 豁免規則

以下情況不受限制:
1. 健康檢查端點 `/health`, `/health/db`
2. Swagger 文件 `/api/docs`
3. 內部服務呼叫 (Service Account)
4. 白名單 IP (辦公室 IP)
