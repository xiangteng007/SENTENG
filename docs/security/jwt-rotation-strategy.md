# JWT Secret 輪替策略 (SEC-003)

> **版本**: 1.0 | **更新日期**: 2026-02-02

---

## 輪替週期

| 環境 | 輪替頻率 | 過渡期 |
|:-----|:---------|:-------|
| Production | 每 90 天 | 7 天 |
| Staging | 每 30 天 | 3 天 |
| Development | 不輪替 | - |

---

## 雙密鑰機制

為確保 token 在輪替期間不失效，實施雙密鑰驗證：

### 1. 配置結構

```typescript
// config/jwt.config.ts
export interface JwtConfig {
  // 當前密鑰 (用於簽發新 token)
  currentSecret: string;
  // 舊密鑰 (過渡期內仍可驗證)
  previousSecret?: string;
  // 過渡期結束時間
  transitionEndsAt?: Date;
}
```

### 2. 驗證邏輯

```typescript
// common/guards/jwt-auth.guard.ts
import { JwtService } from '@nestjs/jwt';

async validateToken(token: string): Promise<any> {
  const config = getJwtConfig();
  
  // 優先使用當前密鑰驗證
  try {
    return this.jwtService.verify(token, { 
      secret: config.currentSecret 
    });
  } catch (err) {
    // 如果在過渡期內，嘗試舊密鑰
    if (config.previousSecret && 
        config.transitionEndsAt && 
        new Date() < config.transitionEndsAt) {
      return this.jwtService.verify(token, { 
        secret: config.previousSecret 
      });
    }
    throw err;
  }
}
```

---

## 輪替流程

### 階段 1: 準備 (D-1)

```bash
# 1. 產生新密鑰
NEW_SECRET=$(openssl rand -base64 64 | tr -d '\n')

# 2. 建立新版本
echo -n "$NEW_SECRET" | \
  gcloud secrets versions add jwt-secret --data-file=-
```

### 階段 2: 啟動過渡期 (D-Day)

```bash
# 1. 更新應用程式配置
# 設定 JWT_CURRENT_SECRET 和 JWT_PREVIOUS_SECRET
gcloud run services update erp-api \
  --region asia-east1 \
  --set-env-vars="JWT_TRANSITION_ENDS=$(date -d '+7 days' --iso-8601)"

# 2. 部署新版本
gcloud run deploy erp-api \
  --image gcr.io/senteng-erp-pro/erp-api:latest \
  --set-secrets="JWT_CURRENT_SECRET=jwt-secret:2,JWT_PREVIOUS_SECRET=jwt-secret:1"
```

### 階段 3: 結束過渡期 (D+7)

```bash
# 1. 移除舊密鑰參照
gcloud run services update erp-api \
  --region asia-east1 \
  --remove-env-vars="JWT_TRANSITION_ENDS" \
  --set-secrets="JWT_SECRET=jwt-secret:2"

# 2. 停用舊版本 Secret
gcloud secrets versions disable jwt-secret --version=1
```

---

## 自動化腳本

```bash
#!/bin/bash
# scripts/rotate-jwt-secret.sh

set -e

PROJECT_ID="senteng-erp-pro"
SECRET_NAME="jwt-secret"
REGION="asia-east1"
SERVICE="erp-api"

echo "🔄 開始 JWT Secret 輪替..."

# 1. 產生新密鑰
NEW_SECRET=$(openssl rand -base64 64 | tr -d '\n')
echo "✅ 新密鑰已產生"

# 2. 新增 Secret 版本
NEW_VERSION=$(echo -n "$NEW_SECRET" | \
  gcloud secrets versions add $SECRET_NAME \
    --data-file=- \
    --project=$PROJECT_ID \
    --format="value(name)" | awk -F'/' '{print $NF}')
echo "✅ Secret 版本 $NEW_VERSION 已建立"

# 3. 取得當前版本號
CURRENT_VERSION=$((NEW_VERSION - 1))

# 4. 設定過渡期 (7 天)
TRANSITION_END=$(date -d '+7 days' --iso-8601)

# 5. 更新 Cloud Run
gcloud run services update $SERVICE \
  --region=$REGION \
  --set-env-vars="JWT_TRANSITION_ENDS=$TRANSITION_END" \
  --set-secrets="JWT_CURRENT_SECRET=$SECRET_NAME:$NEW_VERSION,JWT_PREVIOUS_SECRET=$SECRET_NAME:$CURRENT_VERSION"

echo "✅ 輪替完成！過渡期至 $TRANSITION_END"
echo "⚠️ 請於 $TRANSITION_END 後執行 cleanup 腳本"
```

---

## 驗證清單

- [ ] 新密鑰可成功簽發 token
- [ ] 舊 token 在過渡期內仍可驗證
- [ ] 過渡期後舊 token 失效
- [ ] 審計日誌記錄輪替事件
- [ ] 監控無異常 401 錯誤

---

## 應急回滾

若新密鑰導致問題：

```bash
# 恢復使用舊密鑰
gcloud run services update erp-api \
  --region asia-east1 \
  --set-secrets="JWT_SECRET=jwt-secret:1"
```
