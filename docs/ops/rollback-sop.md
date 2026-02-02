# Rollback Standard Operating Procedure (OPS-003)

> **版本**: 1.0 | **更新日期**: 2026-02-02

---

## 前端 (Vercel) 回滾流程

### 即時回滾 (< 1 分鐘)
```bash
# 1. 登入 Vercel Dashboard
# https://vercel.com/dashboard

# 2. 選擇專案 senteng-web
# 3. 進入 Deployments 頁籤
# 4. 找到上一個穩定部署 (綠色勾選)
# 5. 點擊右側 "..." → "Promote to Production"
```

### CLI 回滾
```bash
# 列出最近部署
vercel list --scope senteng

# 回滾到特定部署
vercel alias set <deployment-url> senteng.co
```

---

## 後端 (Cloud Run) 回滾流程

### 即時回滾 (< 2 分鐘)
```bash
# 1. 列出可用版本
gcloud run revisions list \
  --service=erp-api \
  --region=asia-east1 \
  --format="table(name,active,createTime)"

# 2. 回滾到指定版本
gcloud run services update-traffic erp-api \
  --region=asia-east1 \
  --to-revisions=<REVISION_NAME>=100
```

### 範例
```bash
# 查看版本
gcloud run revisions list --service=erp-api --region=asia-east1

# 假設輸出：
# NAME                      ACTIVE  CREATE_TIME
# erp-api-00042-abc         ✓       2026-02-02T10:00:00Z
# erp-api-00041-xyz                 2026-02-01T18:00:00Z

# 回滾到 00041
gcloud run services update-traffic erp-api \
  --region=asia-east1 \
  --to-revisions=erp-api-00041-xyz=100
```

---

## 資料庫回滾 (謹慎操作)

### Migration 回滾
```bash
# 1. SSH 至有 DB 連線的環境
# 2. 執行 TypeORM 回滾
npm run typeorm migration:revert

# 注意: 每次只會回滾一個 migration
# 重複執行以回滾多個
```

### 緊急: 時間點復原 (PITR)
```bash
# Cloud SQL PITR (需事先啟用)
gcloud sql instances clone senteng-db senteng-db-restored \
  --point-in-time="2026-02-02T09:00:00Z"
```

---

## 驗證步驟

### 1. 健康檢查
```bash
# 後端
curl -s https://erp-api-710372530107.asia-east1.run.app/health | jq

# 預期: {"status":"ok","timestamp":"..."}
```

### 2. 前端驗證
```bash
curl -I https://senteng.co
# 預期: HTTP/2 200
```

### 3. 完整鏈路驗證
```bash
# 登入測試
curl -X POST https://erp-api-710372530107.asia-east1.run.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@senteng.co","password":"***"}'
```

---

## 聯絡與升級

| 狀況 | 動作 | 聯絡人 |
|:-----|:-----|:-------|
| 前端問題 | Vercel 回滾 | Frontend Lead |
| 後端 API | Cloud Run 回滾 | Backend Lead |
| 資料庫 | 評估 PITR | DBA / DevOps |
| 全系統 | 啟動 Incident Response | On-call |

---

## Checklist

- [ ] 問題確認 & 截圖
- [ ] Slack/LINE 通知團隊
- [ ] 執行回滾
- [ ] 驗證健康檢查
- [ ] 驗證核心功能
- [ ] 更新 Incident Log
- [ ] Post-mortem 排程
