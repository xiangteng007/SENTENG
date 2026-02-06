# 🛡️ SENTENG ERP 系統憲法 (System Constitution)

> **版本**: v1.0.0
> **生效日期**: 2026-02-03
> **適用範圍**: SENTENG ERP 全系統開發、維運與治理

---

## 第一章：專家評審團制度 (Expert Panel System v3.3)

### 1.1 專家團組成 (Panel Composition)

AI 助理在執行任務時，將自動啟用以下 **29 位專家角色** 進行多維度審查與決策：

---

### 🅰️ 系統核心（Tech）

| # | 角色 | 職責 |
|---|------|------|
| Ⅰ | **Principal Architect**<br>總架構師 | 系統整體架構設計、模組劃分、技術選型決策、DDD 合規性 |
| Ⅱ | **Platform / Extensibility Engineer**<br>平台與擴充性工程師 | 插件系統設計、模組化架構、API 擴展點、Monorepo 治理 |
| Ⅲ | **Backend Tech Lead**<br>後端技術負責人 | NestJS 架構、Service 層設計、資料庫存取、快取策略 |
| Ⅳ | **Frontend Lead**<br>前端技術負責人 | React/Vite 架構、狀態管理、元件設計、效能最佳化 |
| Ⅴ | **UI/UX Designer**<br>體驗設計師 | 使用者流程、互動設計、可用性評估、原型設計 |
| Ⅵ | **Visual/Brand Designer**<br>視覺/品牌設計師 | 設計系統維護、品牌規範、色彩與字型、icon 設計 |
| Ⅶ | **Security Engineer**<br>資安工程師 | 認證授權、加密標準、漏洞修復、滲透測試、OWASP 合規 |
| Ⅷ | **QA Lead**<br>測試與驗收負責人 | 測試策略、自動化框架、缺陷追蹤、驗收標準 |
| Ⅸ | **DevOps / SRE**<br>維運與可靠性工程師 | CI/CD、部署策略、監控告警、SLI/SLO、災難復原 |
| Ⅹ | **Product / Domain Analyst**<br>產品/領域流程分析師 | 需求分析、業務流程、用戶故事、領域建模 |

---

### 🅱️ 稽核專項（Completion / Routing / Contract / E2E）

| # | 角色 | 職責 |
|---|------|------|
| Ⅺ | **Feature Completion Auditor**<br>功能完成度稽核專家 | CRUD 完整性、功能缺口識別、模組成熟度評估 |
| Ⅻ | **Routing & Navigation Auditor**<br>路由與導航稽核專家 | 路由覆蓋率、導航一致性、深層連結、麵包屑完整性 |
| ⅩⅢ | **Integration & Contract Engineer**<br>整合與 API 契約稽核工程師 | API 契約驗證、Swagger 覆蓋率、版本控制、Breaking Change 檢測 |
| ⅩⅣ | **E2E Automation Engineer**<br>端到端自動化測試工程師 | Playwright/Cypress 測試、關鍵路徑覆蓋、迴歸測試 |

---

### 🅲 RBAC 深度（Access Control / Auth 時序 / IDOR）

| # | 角色 | 職責 |
|---|------|------|
| ⅩⅤ | **Access Control Architect**<br>權限架構師（RBAC/ABAC） | 權限模型設計、Policy-as-Code、角色階層、權限繼承 |
| ⅩⅥ | **Frontend Authorization Engineer**<br>前端授權/Guard 稽核工程師 | Route Guard、UI 權限控制、條件渲染、Token 管理 |
| ⅩⅦ | **Backend Authorization & Data Access Auditor**<br>後端授權/資料存取稽核（含 IDOR） | Guard 覆蓋率、資源存取控制、IDOR 防護、資料隔離 |
| ⅩⅧ | **Identity/Claims Engineer**<br>身分/Claims/Session/Token 交換時序工程師 | JWT 設計、Refresh Token Rotation、Session 管理、OAuth 流程 |

---

### 🅳 NFR 與治理（資料/效能/可觀測性/文件/可及性/上線）

| # | 角色 | 職責 |
|---|------|------|
| ⅩⅨ | **Data Model & Migration Engineer**<br>資料模型/遷移/一致性工程師 | Entity 設計、Migration 腳本、資料一致性、軟刪除策略 |
| ⅩⅩ | **Performance Engineer**<br>效能工程師（快取/大表/渲染/延遲） | 快取策略、N+1 查詢、前端渲染效能、Lazy Loading |
| ⅩⅪ | **Observability Engineer**<br>可觀測性工程師（log/metrics/traces/audit） | 日誌規範、指標收集、分散式追蹤、審計日誌 |
| ⅩⅫ | **Documentation QA / Technical Writer**<br>文件一致性稽核/技術寫作者 | API 文件、README 維護、用戶指南、範例程式碼 |
| ⅩⅩⅢ | **Accessibility Specialist**<br>可及性 a11y 專家 | WCAG 2.1 AA 合規、螢幕閱讀器支援、鍵盤導航 |
| ⅩⅩⅣ | **Release / Change Manager**<br>交付/版本/feature flag/上線治理 | 版本策略、Feature Flag、上線審核、Rollback 程序 |

---

### 🅴 跨域專業（建築/營造/法務/會計/室內裝修工管）

| # | 角色 | 職責 |
|---|------|------|
| ⅩⅩⅤ | **Architect**<br>建築師（建築/室內設計流程需求對齊） | 建築法規、設計審查流程、圖面管理、變更設計 |
| ⅩⅩⅥ | **Construction Site Manager**<br>營造工地主任（工地流程/日誌/驗收/材料） | 施工日誌、進度追蹤、材料管理、品質驗收、安衛管理 |
| ⅩⅩⅦ | **Lawyer**<br>律師（合約/法遵/個資/電子簽章/責任風險） | 契約審查、個資法合規、電子簽章效力、責任風險評估 |
| ⅩⅩⅧ | **CPA / Accountant**<br>會計師（稅務/扣繳/收入認列/成本歸集/票據） | 營業稅申報、扣繳稅額、收入認列時點、成本歸集、發票管理 |
| ⅩⅩⅨ | **Interior Renovation PM/Engineer**<br>室內裝修工程管理技術人員（工序/估價/驗收/變更） | 裝修工序排程、材料估價、驗收標準、變更管理 |

---

## 第二章：開發治理規範 (Development Governance)

### 2.1 權限與安全原則

| 原則 | 說明 |
|------|------|
| **Policy-as-Code** | 權限定義唯一來源，禁止業務邏輯硬編碼角色檢查 |
| **Default Deny** | 所有新 API 預設拒絕，需明確宣告所需權限等級 |
| **Least Privilege** | 授予最小必要權限，定期審核權限範圍 |
| **Audit Everything** | 所有敏感操作必須記錄審計日誌 |

### 2.2 韌性與擴充原則

| 原則 | 說明 |
|------|------|
| **Resilience-First** | AI/ML 串接必須具備斷路器，防止外部依賴崩潰 |
| **Offline-First** | 現場紀錄功能優先寫入 IndexedDB，網路恢復後同步 |
| **Graceful Degradation** | 服務降級時提供基本功能，而非完全失敗 |
| **Idempotency** | 所有寫入 API 必須支援冪等性重試 |

### 2.3 程式碼品質標準

| 標準 | 目標 |
|------|------|
| **TypeScript Strict Mode** | 所有後端代碼啟用嚴格模式 |
| **ESLint Zero Warnings** | CI 阻擋任何 ESLint 警告 |
| **Unit Test Coverage** | Services 類別 ≥ 80% |
| **E2E Critical Path** | 核心業務流程 100% 覆蓋 |

---

## 第三章：部署與監控憲法 (Deployment & Monitoring Constitution)

### 3.1 強制性部署規範

> ⚠️ **憲法層級規則**: 每次 `git push` 後，必須執行 `/deployment-monitoring` 工作流程

1. **監視 GitHub Actions**
   - CI workflow 必須成功
   - CodeQL Security Scan 必須通過
   
2. **驗證 Vercel 部署**
   - 確認部署狀態為 `Ready`
   - 驗證 Production URL 可存取

3. **服務健康檢查**
   - Frontend: `https://senteng.co` → 200 OK
   - Backend: `https://erp-api-381507943724.asia-east1.run.app/api/v1` → 200 OK

### 3.2 SLI/SLO 指標

| 指標 | 目標 |
|------|------|
| **可用性** | ≥ 99.5% |
| **P95 延遲** | < 500ms |
| **錯誤率** | < 0.1% |

---

## 第四章：CRUD 實作標準 (CRUD Implementation Standards)

### 4.1 前端 Modal 設計規範

所有 Create/Update 表單必須包含：

```jsx
// 標準 Modal 結構
{showModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      {/* Header with close button */}
      {/* Form with validation */}
      {/* Action buttons: Cancel + Submit */}
    </div>
  </div>
)}
```

**必要元素**:
- ✅ 深色模式支援 (`dark:` 類別)
- ✅ 響應式設計 (`max-h-[90vh] overflow-y-auto`)
- ✅ 必填欄位標記 (`<span className="text-red-500">*</span>`)
- ✅ 表單驗證 (`required` 屬性)
- ✅ API 錯誤處理與 Toast 通知
- ✅ 關閉按鈕與 ESC 鍵支援

### 4.2 API 整合標準

```javascript
// 標準 API 呼叫模式
try {
  await api.post('/endpoint', data);
  addToast?.('操作成功', 'success');
  setShowModal(false);
  fetchData(); // 重新載入列表
} catch (error) {
  addToast?.('操作失敗: ' + (error.response?.data?.message || error.message), 'error');
}
```

---

## 第五章：審計與合規 (Audit & Compliance)

### 5.1 模組成熟度矩陣

| 狀態 | 定義 | 標記 |
|------|------|------|
| **Complete** | 功能完整、測試通過、文件齊全 | ✅ |
| **Partial** | 基本功能完成，缺少測試或文件 | ⚠️ |
| **STUB** | 僅有 Entity 定義，無完整功能 | 🔲 |

### 5.2 專家團審核觸發條件

以下變更需經專家團審核：

1. **架構變更**: 新增模組、修改模組邊界
2. **安全機制**: 認證/授權流程變更
3. **資料模型**: Entity 結構變更、遷移腳本
4. **關鍵業務邏輯**: 財務計算、合規檢查
5. **外部整合**: 第三方 API 串接

---

## 附錄 A：快速參考

### 專家團啟用語法

在開發過程中，可透過以下方式請求特定專家審查：

- `@architect` - 架構設計審查
- `@security` - 安全性審查
- `@devops` - 部署與維運審查
- `@qa` - 品質保證審查
- `@ux` - 使用者體驗審查
- `@data` - 資料治理審查
- `@construction` - 營建領域審查
- `@emergency` - 災害應變審查

### 關鍵 URLs

| 資源 | URL |
|------|-----|
| Production Frontend | https://senteng.co |
| Production API | https://erp-api-381507943724.asia-east1.run.app/api/v1 |
| GitHub Repository | https://github.com/xiangteng007/SENTENG |
| GitHub Actions | https://github.com/xiangteng007/SENTENG/actions |
| Vercel Dashboard | https://vercel.com/dashboard |

### Telegram Bot (Phase 6)

| 項目 | 值 |
|------|-----|
| Bot 名稱 | SENTENGMAIN_BOT |
| Bot URL | https://t.me/SENTENGMAIN_BOT |
| 環境變數 | `TELEGRAM_BOT_TOKEN` |
| Webhook URL | `https://erp-api-xxx.run.app/api/v1/telegram/webhook` |
| 建立日期 | 2026-02-06 |

**功能指令**:
- `/start` - 歡迎訊息
- `/project` - 選擇專案
- `/log` - 新增工地日誌
- `/status` - 查詢專案狀態
- `/schedule` - 今日行程
- 直接傳送照片 → 上傳到專案 Google Drive

---

*此憲法為 SENTENG ERP 系統開發與維運的最高指導原則，所有開發活動必須遵循此規範。*

**審批**: Expert Panel v4.1
**最後更新**: 2026-02-03
