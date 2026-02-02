# 模組清單 (ARCH-004)

> **版本**: 1.0 | **更新日期**: 2026-02-02
> **說明**: 此為官方模組清單，解決 33 vs 108 模組計數矛盾

---

## 定義說明

| 類型 | 定義 | 當前數量 |
|:-----|:-----|:--------:|
| **NestJS 模組** | `@Module()` 裝飾器的 TypeScript 類別 | 33 |
| **邏輯單元** | 業務功能點 (含子功能) | 108 |
| **戰略領域** | DDD 領域邊界 | 9 |

---

## NestJS 模組清單 (33 個)

### Core (3)
1. `AppModule` - 根模組
2. `CommonModule` - 共用服務
3. `DatabaseModule` - 資料庫連線

### Auth & Users (3)
4. `AuthModule` - 認證授權
5. `UsersModule` - 用戶管理
6. `PermissionsModule` - 權限管理

### Business Core (10)
7. `ProjectsModule` - 專案管理
8. `ClientsModule` - 客戶管理
9. `VendorsModule` - 廠商管理
10. `QuotationsModule` - 報價管理
11. `ContractsModule` - 合約管理
12. `PaymentsModule` - 請款管理
13. `InvoicesModule` - 發票管理
14. `FinanceModule` - 財務管理
15. `InventoryModule` - 庫存管理
16. `ProcurementsModule` - 採購管理

### Construction Domain (5)
17. `ConstructionModule` - 施工管理
18. `DispatchModule` - 派工管理
19. `SafetyModule` - 安全管理
20. `QualityModule` - 品質管理
21. `ProgressModule` - 進度管理

### Support (6)
22. `ScheduleModule` - 排程管理
23. `NotificationsModule` - 通知服務
24. `ReportsModule` - 報表服務
25. `FilesModule` - 檔案管理
26. `AuditModule` - 審計日誌
27. `IntegrationsModule` - 外部整合

### Emergency (3)
28. `EmergencyModule` - 緊急應變
29. `DashboardModule` - 儀表板
30. `MissionsModule` - 任務管理

### Utility (3)
31. `HealthModule` - 健康檢查
32. `SeedModule` - 資料種子
33. `MigrationModule` - 資料遷移

---

## 九大戰略領域

1. **MissionCommand** - 任務指揮
2. **GeoIntel** - 地理情報
3. **AirOps** - 空中作業
4. **Personnel** - 人員管理
5. **Logistics** - 後勤補給
6. **Communications** - 通訊系統
7. **Safety** - 安全管理
8. **Training** - 教育訓練
9. **Administration** - 行政管理

---

## 邏輯單元說明

108 個邏輯單元是將模組進一步細分的業務功能點，例如：

- `ProjectsModule` 包含: 
  - 專案 CRUD (4)
  - 專案狀態管理 (3)
  - 專案成員管理 (3)
  - 專案文件管理 (4)
  - = 14 邏輯單元

- `FinanceModule` 包含:
  - 帳戶管理 (5)
  - 交易管理 (6)
  - 貸款管理 (4)
  - 統計報表 (5)
  - = 20 邏輯單元

詳細邏輯單元清單請參考 API 文件。
