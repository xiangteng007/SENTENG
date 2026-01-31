---
description: Standard workflow for pushing changes and monitoring deployments
---

# Post-Push Deployment Monitoring Workflow

// turbo-all

## 1. Push Changes to GitHub
```bash
git push origin main
```

## 2. Monitor Vercel Deployment (Frontend)
Open browser and check: https://vercel.com/xiangteng007/senteng-system/deployments

**Expected Status Progress:**
- `Queued` → `Building` → `Ready` ✅

**If Error:**
- Note the error message
- Check build logs for details
- Fix the issue and push again

## 3. Monitor Cloud Run Deployment (Backend)
Check GitHub Actions: https://github.com/xiangteng007/SENTENG/actions

**Workflow to watch:** `deploy-api.yml`

**Expected Status:**
- `In progress` → `Success` ✅

**If Failed:**
- Check the failed step logs
- Common issues: Docker build, missing env vars, TypeScript errors

## 4. Record Deployment Issues
If any deployment fails, document in:
- `C:\Users\xiang\.gemini\antigravity\brain\{conversation-id}\deployment_issues.md`

Include:
- Timestamp
- Commit hash
- Error message
- Resolution steps

## 5. Verification URLs
| Service | Health Check URL |
|---------|------------------|
| Frontend | https://senteng.co |
| Backend | https://erp-api-381507943724.asia-east1.run.app/health |

---

## Deployment Matrix Reference
| Component | Platform | Repository |
|-----------|----------|------------|
| Frontend Web | Vercel (senteng-system) | xiangteng007/SENTENG |
| Backend API | Cloud Run | xiangteng007/SENTENG |
| Source Code | GitHub | https://github.com/xiangteng007/SENTENG |
