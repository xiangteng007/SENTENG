# Staging 環境建置規範 (OPS-004)

> **版本**: 1.0 | **更新日期**: 2026-02-02

---

## 環境拓撲

```
                    ┌─────────────────────────────────────────────┐
                    │               senteng-erp-pro               │
                    │                 (GCP Project)               │
                    └─────────────────────────────────────────────┘
                                         │
                    ┌────────────────────┴────────────────────┐
                    │                                         │
           ┌────────┴────────┐                    ┌───────────┴────────┐
           │   Production    │                    │      Staging       │
           └─────────────────┘                    └────────────────────┘
                    │                                         │
    ┌───────────────┼───────────────┐         ┌───────────────┼───────────────┐
    │               │               │         │               │               │
┌───┴───┐     ┌─────┴─────┐    ┌────┴───┐ ┌───┴───┐     ┌─────┴─────┐    ┌────┴───┐
│ Cloud │     │  Cloud    │    │ Cloud  │ │ Cloud │     │  Cloud    │    │ Cloud  │
│  Run  │     │   SQL     │    │Storage │ │  Run  │     │   SQL     │    │Storage │
│(prod) │     │  (prod)   │    │ (prod) │ │(stg)  │     │  (stg)    │    │ (stg)  │
└───────┘     └───────────┘    └────────┘ └───────┘     └───────────┘    └────────┘
```

---

## 資源規格

| 資源 | Production | Staging | 差異原因 |
|:-----|:-----------|:--------|:---------|
| Cloud Run vCPU | 2 | 1 | 成本 |
| Cloud Run Memory | 2Gi | 512Mi | 成本 |
| Cloud Run Min/Max | 1/10 | 0/2 | 成本 |
| Cloud SQL Tier | db-custom-2-7680 | db-f1-micro | 成本 |
| Cloud SQL Storage | 100GB SSD | 10GB HDD | 成本 |

---

## 建置步驟

### 1. Cloud SQL Staging

```bash
# 建立 Staging 資料庫實例
gcloud sql instances create senteng-db-staging \
  --tier=db-f1-micro \
  --region=asia-east1 \
  --database-version=POSTGRES_15 \
  --storage-type=HDD \
  --storage-size=10GB

# 建立資料庫
gcloud sql databases create senteng_staging \
  --instance=senteng-db-staging

# 建立用戶
gcloud sql users create staging_user \
  --instance=senteng-db-staging \
  --password=<staging-password>
```

### 2. Cloud Run Staging

```bash
# 部署 Staging 服務
gcloud run deploy erp-api-staging \
  --image gcr.io/senteng-erp-pro/erp-api:staging \
  --region asia-east1 \
  --cpu 1 \
  --memory 512Mi \
  --min-instances 0 \
  --max-instances 2 \
  --set-env-vars "NODE_ENV=staging,DB_HOST=/cloudsql/senteng-erp-pro:asia-east1:senteng-db-staging"
```

### 3. Vercel Staging (前端)

```bash
# 建立 Staging 分支部署
vercel link --project senteng-web-staging
vercel --prod --env VITE_API_URL=https://erp-api-staging.senteng.co
```

---

## CI/CD 整合

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging

on:
  push:
    branches: [develop]

jobs:
  deploy-api-staging:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Authenticate to GCP
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: Build and Push Docker
        run: |
          docker build -t gcr.io/senteng-erp-pro/erp-api:staging .
          docker push gcr.io/senteng-erp-pro/erp-api:staging
      
      - name: Deploy to Cloud Run Staging
        run: |
          gcloud run deploy erp-api-staging \
            --image gcr.io/senteng-erp-pro/erp-api:staging \
            --region asia-east1 \
            --set-env-vars "NODE_ENV=staging"
```

---

## 環境變數差異

| 變數 | Production | Staging |
|:-----|:-----------|:--------|
| `NODE_ENV` | production | staging |
| `DB_DATABASE` | senteng_prod | senteng_staging |
| `CORS_ORIGINS` | senteng.co | staging.senteng.co |
| `LOG_LEVEL` | warn | debug |
| `RATE_LIMIT_MULTIPLIER` | 1 | 5 (寬鬆) |

---

## 資料同步

### 從 Production 匿名複製

```bash
#!/bin/bash
# scripts/sync-staging-data.sh

# 1. 匯出 Production 資料 (排除敏感)
gcloud sql export sql senteng-db-prod \
  gs://senteng-backups/prod-export.sql \
  --database=senteng_prod \
  --offload

# 2. 匿名化敏感欄位
python scripts/anonymize-data.py prod-export.sql > staging-data.sql

# 3. 匯入 Staging
gcloud sql import sql senteng-db-staging \
  gs://senteng-backups/staging-data.sql \
  --database=senteng_staging
```

### 匿名化規則

| 表格 | 欄位 | 匿名規則 |
|:-----|:-----|:---------|
| users | email | `faker.email()` |
| users | password | 統一 hash |
| clients | phone | `09XX-XXX-XXX` |
| clients | email | `faker.email()` |

---

## 存取控制

| 角色 | Staging 存取 | Production 存取 |
|:-----|:------------:|:---------------:|
| 開發人員 | ✅ | ❌ |
| QA | ✅ | ❌ |
| DevOps | ✅ | ✅ |
| PM | ✅ (唯讀) | ❌ |

---

## 驗證清單

- [ ] Cloud Run Staging 可存取
- [ ] Cloud SQL Staging 可連線
- [ ] CI/CD develop 分支自動部署
- [ ] 資料已匿名化
- [ ] 環境變數正確設定
- [ ] IAM 權限限縮
