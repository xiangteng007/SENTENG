# API 版本化策略 (ARCH-003)

> **版本**: 1.0 | **更新日期**: 2026-02-02

---

## 策略選擇

採用 **URL 路徑版本化** (Path Versioning):

```
https://api.senteng.co/api/v1/projects
https://api.senteng.co/api/v2/projects
```

### 決策理由

| 方案 | 優點 | 缺點 | 選擇 |
|:-----|:-----|:-----|:----:|
| URL 路徑 | 直觀、易快取 | 違反 REST 純粹性 | ✅ |
| Header | 符合 REST | 隱晦、無法瀏覽器測試 | ❌ |
| Query | 簡單 | 不適合快取 | ❌ |

---

## 版本號規則

### 語意版本

```
v{MAJOR}.{MINOR}
```

- **MAJOR**: 破壞性變更 (v1 → v2)
- **MINOR**: 非破壞性新增 (v1.0 → v1.1) - 選用

### 破壞性變更定義

- 移除端點
- 移除必需參數
- 變更回應結構
- 變更認證方式
- 變更錯誤碼

### 非破壞性變更

- 新增端點
- 新增可選參數
- 新增回應欄位
- 修正 bug
- 效能改進

---

## 實作架構

### 1. 目錄結構

```
apps/api/src/
├── v1/
│   ├── v1.module.ts
│   └── controllers/
│       ├── projects.v1.controller.ts
│       └── clients.v1.controller.ts
├── v2/
│   ├── v2.module.ts
│   └── controllers/
│       ├── projects.v2.controller.ts
│       └── clients.v2.controller.ts
└── shared/
    ├── services/
    └── entities/
```

### 2. 路由配置

```typescript
// app.module.ts
@Module({
  imports: [
    RouterModule.register([
      {
        path: 'api/v1',
        module: V1Module,
      },
      {
        path: 'api/v2',
        module: V2Module,
      },
    ]),
    V1Module,
    V2Module,
  ],
})
export class AppModule {}
```

### 3. Controller 範例

```typescript
// v2/controllers/projects.v2.controller.ts
@Controller('projects')
@ApiTags('Projects (v2)')
export class ProjectsV2Controller {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all projects (v2 format)' })
  async findAll(): Promise<ProjectV2Dto[]> {
    const projects = await this.projectsService.findAll();
    // V2 特定的資料轉換
    return projects.map(this.toV2Format);
  }

  private toV2Format(project: Project): ProjectV2Dto {
    return {
      id: project.id,
      name: project.name,
      // V2 新增欄位
      metadata: {
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        version: 2,
      },
    };
  }
}
```

---

## 版本生命週期

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│   Active    │   Active    │ Deprecated  │   Sunset    │
│    (v3)     │    (v2)     │    (v1)     │   (v0)      │
├─────────────┼─────────────┼─────────────┼─────────────┤
│  新開發     │  支援中     │  僅維護     │  已關閉     │
│  推薦使用   │  推薦使用   │  不推薦     │  404        │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

### 時間表

| 狀態 | 持續時間 | 說明 |
|:-----|:---------|:-----|
| Active | 無限 | 完整支援 |
| Deprecated | 6 個月 | 回應加入 Warning header |
| Sunset | - | 回傳 410 Gone |

---

## 棄用通知

### Header 通知

```http
HTTP/1.1 200 OK
Deprecation: true
Sunset: Sat, 01 Aug 2026 00:00:00 GMT
Link: </api/v2/projects>; rel="successor-version"
Warning: 299 - "API v1 is deprecated. Please migrate to v2 by 2026-08-01"
```

### OpenAPI 標註

```typescript
@ApiOperation({
  summary: 'Get projects',
  deprecated: true,
  description: '⚠️ Deprecated: Please use /api/v2/projects',
})
```

---

## 文件策略

- 每個版本獨立 Swagger 文件
  - `/api/v1/docs`
  - `/api/v2/docs`
- 主文件列出所有可用版本
- 遷移指南獨立文件

---

## 驗證清單

- [ ] V1/V2 路由正確分離
- [ ] Swagger 文件正確分版
- [ ] Deprecation headers 實作
- [ ] 遷移指南文件
- [ ] E2E 測試覆蓋兩版本
