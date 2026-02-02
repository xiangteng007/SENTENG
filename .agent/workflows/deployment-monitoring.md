---
description: 【必須執行】每次推送 GitHub 後監視部署情況並除錯
---

# 部署監控工作流程（憲法層級）

> ⚠️ **強制規則**：每次執行 `git push` 後，必須立即開啟瀏覽器監視部署狀態，直到確認部署成功或修復錯誤。

// turbo-all

## 1. 推送變更到 GitHub
```bash
git push origin main
```

## 2. 【必須】開啟瀏覽器監視 GitHub Actions
使用 `browser_subagent` 工具導航至：
- https://github.com/xiangteng007/SENTENG/actions

**監視重點：**
- CI workflow 狀態
- CodeQL Security Scan 狀態
- deploy-api.yml 狀態（如有觸發）

**預期狀態：**
- `In progress` → `Success` ✅

**若失敗：**
1. 點擊失敗的 workflow 查看詳細日誌
2. 識別失敗步驟和錯誤訊息
3. 立即修復並重新推送
4. 重複監視直到成功

## 3. 【必須】監視 Vercel 部署（前端）
使用 `browser_subagent` 工具導航至：
- https://vercel.com/dashboard（找到 senteng-system 專案）

**預期狀態：**
- `Queued` → `Building` → `Ready` ✅

**若失敗：**
1. 查看建置日誌
2. 識別錯誤原因
3. 修復並重新推送

## 4. 驗證服務健康狀態
```powershell
# 前端
Invoke-WebRequest -Uri "https://senteng.co" -UseBasicParsing -Method Head | Select-Object StatusCode

# 後端
Invoke-WebRequest -Uri "https://erp-api-381507943724.asia-east1.run.app/api/v1" -UseBasicParsing | Select-Object StatusCode
```

**預期：** 兩者都返回 `200`

## 5. 記錄部署問題
若任何部署失敗，在 walkthrough.md 中記錄：
- 時間戳
- Commit hash
- 錯誤訊息
- 解決步驟

---

## 驗證 URLs 參考
| 服務 | URL |
|------|-----|
| Frontend | https://senteng.co |
| Backend API | https://erp-api-381507943724.asia-east1.run.app/api/v1 |
| GitHub Actions | https://github.com/xiangteng007/SENTENG/actions |
| Vercel Dashboard | https://vercel.com/dashboard |

## 部署矩陣
| 元件 | 平台 | 觸發條件 |
|------|------|----------|
| Frontend Web | Vercel | 自動（push 到 main） |
| Backend API | Cloud Run | deploy-api.yml（手動或特定路徑） |
| CI/Lint/Test | GitHub Actions | 每次 push |
| Security Scan | CodeQL | 每次 push |
