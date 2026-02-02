# TypeORM Migrations

## 說明

本目錄包含資料庫遷移腳本，用於管理資料庫架構變更。

## 目錄結構

```
migrations/
├── README.md
├── 1738500000000-InitialSchema.ts
└── [timestamp]-[description].ts
```

## 常用指令

### 產生新 Migration

```bash
npm run migration:generate -- src/migrations/[MigrationName]
```

### 執行 Migration

```bash
npm run migration:run
```

### 回滾 Migration

```bash
npm run migration:revert
```

### 查看 Migration 狀態

```bash
npm run migration:show
```

## 重要提醒

1. **永遠不要在 Production 使用 `synchronize: true`**
2. Migration 一旦執行，不應修改
3. 每次變更 Entity 都應產生新的 Migration
4. 先在開發環境測試後再部署到生產

## 命名規範

- 檔名: `[timestamp]-[PascalCaseDescription].ts`
- 範例: `1738500001000-AddNewEntities.ts`

## 資料來源設定

見 `src/data-source.ts`:
- entities: `dist/**/*.entity.js`
- migrations: `dist/migrations/*.js`
