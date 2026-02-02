# GCP Secret Manager 遷移策略 (SEC-002)

> **版本**: 1.0 | **更新日期**: 2026-02-02

---

## 概述

本文件定義將硬編碼 secrets 遷移至 Google Cloud Secret Manager 的完整策略。

---

## 當前 Secrets 清單

| Secret 名稱 | 用途 | 敏感度 | 遷移優先級 |
|:------------|:-----|:------:|:----------:|
| `JWT_SECRET` | JWT 簽名密鑰 | 極高 | P0 |
| `DB_PASSWORD` | 資料庫密碼 | 極高 | P0 |
| `GOOGLE_CLIENT_SECRET` | OAuth 密鑰 | 高 | P1 |
| `GOOGLE_REFRESH_TOKEN` | OAuth Token | 高 | P1 |
| `SENTRY_DSN` | Sentry 連線 | 中 | P2 |

---

## 實施步驟

### 1. 建立 Secrets (GCP Console)

```bash
# 建立 JWT Secret
gcloud secrets create jwt-secret \
  --replication-policy="automatic" \
  --project=senteng-erp-pro

# 新增版本
echo -n "your-super-secret-jwt-key" | \
  gcloud secrets versions add jwt-secret --data-file=-

# 建立 DB Password Secret
gcloud secrets create db-password \
  --replication-policy="automatic" \
  --project=senteng-erp-pro

echo -n "your-db-password" | \
  gcloud secrets versions add db-password --data-file=-
```

### 2. 授權 Cloud Run 存取 Secrets

```bash
# 取得 Cloud Run Service Account
SA="381507943724-compute@developer.gserviceaccount.com"

# 授權存取 jwt-secret
gcloud secrets add-iam-policy-binding jwt-secret \
  --member="serviceAccount:$SA" \
  --role="roles/secretmanager.secretAccessor"

# 授權存取 db-password  
gcloud secrets add-iam-policy-binding db-password \
  --member="serviceAccount:$SA" \
  --role="roles/secretmanager.secretAccessor"
```

### 3. 更新 Cloud Run 部署配置

```yaml
# .github/workflows/deploy-api.yml
- name: Deploy to Cloud Run
  run: |
    gcloud run deploy erp-api \
      --image gcr.io/$PROJECT_ID/erp-api:$SHA \
      --region asia-east1 \
      --set-secrets="JWT_SECRET=jwt-secret:latest,DB_PASSWORD=db-password:latest" \
      --allow-unauthenticated
```

### 4. 應用程式碼適配

```typescript
// apps/api/src/config/secrets.config.ts
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();

export async function getSecret(secretName: string): Promise<string> {
  const projectId = process.env.GCP_PROJECT_ID || 'senteng-erp-pro';
  const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
  
  const [version] = await client.accessSecretVersion({ name });
  return version.payload.data.toString();
}

// 使用方式
const jwtSecret = await getSecret('jwt-secret');
```

---

## 驗證清單

- [ ] 所有 P0 secrets 已建立於 Secret Manager
- [ ] Service Account 已獲得適當權限
- [ ] Cloud Run 部署使用 `--set-secrets` 參數
- [ ] 本地開發使用 `.env.local` (已加入 .gitignore)
- [ ] 移除 repo 中的所有硬編碼 secrets
- [ ] 更新 README 文件說明 secrets 管理

---

## 安全注意事項

1. **永不提交 secrets** - 使用 pre-commit hook 掃描
2. **定期輪替** - 每 90 天輪替一次
3. **最小權限** - 僅授予必要 Service Account
4. **審計日誌** - 啟用 Secret Manager 存取日誌
5. **版本控制** - 保留最近 3 個版本以便回滾

---

## 回滾程序

若 Secret Manager 整合失敗：

1. 還原 Cloud Run 到上一版本
2. 使用環境變數臨時注入 secrets
3. 調查 Secret Manager 權限問題
4. 修復後重新部署
