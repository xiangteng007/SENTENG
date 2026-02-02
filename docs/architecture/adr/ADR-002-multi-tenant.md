# ADR-002: Multi-tenant 架構評估 (EXT-002)

> **狀態**: Proposed | **日期**: 2026-02-02

---

## 背景

隨著 SENTENG ERP 成長，需評估多租戶架構以支援：
- 多家公司/分公司使用
- SaaS 服務模式
- 資料隔離需求

---

## 方案比較

### 1. Row-Level Security (RLS)

```
┌─────────────────────────────────────────────────────────────┐
│                   單一資料庫                                │
├─────────────────────────────────────────────────────────────┤
│  projects (tenant_id, ...)                                 │
│  clients (tenant_id, ...)                                  │
│  invoices (tenant_id, ...)                                 │
│                                                             │
│  每個查詢自動加入 WHERE tenant_id = ?                       │
└─────────────────────────────────────────────────────────────┘
```

| 優點 | 缺點 |
|:-----|:-----|
| 實作簡單 | 資料完全隔離度較低 |
| 維護成本低 | 單一故障點 |
| 資源共享效率高 | 大租戶效能影響小租戶 |
| 易於查詢跨租戶資料 | 需謹慎處理 JOIN |

### 2. Schema per Tenant

```
┌─────────────────────────────────────────────────────────────┐
│                   單一資料庫                                │
├──────────────────┬──────────────────┬──────────────────────┤
│   tenant_001     │   tenant_002     │   tenant_003         │
│   -----------    │   -----------    │   -----------        │
│   projects       │   projects       │   projects           │
│   clients        │   clients        │   clients            │
│   invoices       │   invoices       │   invoices           │
└──────────────────┴──────────────────┴──────────────────────┘
```

| 優點 | 缺點 |
|:-----|:-----|
| 較好的隔離度 | Schema 管理複雜 |
| 可針對租戶優化 | Migration 需逐 Schema 執行 |
| 災難恢復較容易 | 連線池管理複雜 |

### 3. Database per Tenant

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  tenant_001 │    │  tenant_002 │    │  tenant_003 │
│   database  │    │   database  │    │   database  │
├─────────────┤    ├─────────────┤    ├─────────────┤
│  projects   │    │  projects   │    │  projects   │
│  clients    │    │  clients    │    │  clients    │
│  invoices   │    │  invoices   │    │  invoices   │
└─────────────┘    └─────────────┘    └─────────────┘
```

| 優點 | 缺點 |
|:-----|:-----|
| 完全資料隔離 | 成本最高 |
| 可獨立備份/恢復 | 維護複雜度最高 |
| 效能完全獨立 | 連線管理困難 |
| 符合某些法規要求 | 無法跨租戶分析 |

---

## 建議方案

### 第一階段: Row-Level Security

基於當前規模和需求，建議採用 **Row-Level Security**：

1. **成本效益最高** - 單一資料庫
2. **實作簡單** - 最小程式碼變更
3. **易於遷移** - 未來可升級到 Schema 隔離

### 實作規劃

#### 1. 添加 tenant_id 欄位

```typescript
// 基礎實體
@Entity()
export abstract class TenantBaseEntity {
  @Column()
  @Index()
  tenantId: string;
}

// 所有實體繼承
@Entity()
export class Project extends TenantBaseEntity {
  // ...
}
```

#### 2. 建立 Tenant 攔截器

```typescript
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.user?.tenantId;
    
    // 注入到 AsyncLocalStorage
    return tenantContext.run({ tenantId }, () => next.handle());
  }
}
```

#### 3. 自動添加 WHERE 條件

```typescript
// TypeORM Subscriber
@EventSubscriber()
export class TenantSubscriber implements EntitySubscriberInterface {
  beforeFind(event: LoadEvent<any>) {
    const tenantId = getTenantId();
    if (tenantId && event.entity?.tenantId !== undefined) {
      event.queryBuilder.andWhere('tenant_id = :tenantId', { tenantId });
    }
  }
}
```

---

## 遷移計畫

| 階段 | 時間 | 工作項目 |
|:-----|:-----|:---------|
| Phase 1 | Week 1-2 | 添加 tenant_id 欄位和 Migration |
| Phase 2 | Week 3-4 | Interceptor 和 Subscriber 實作 |
| Phase 3 | Week 5-6 | 主要模組適配和測試 |
| Phase 4 | Week 7-8 | 租戶管理 UI 和驗證 |

---

## 結論

採用 Row-Level Security 作為初期多租戶方案，在簡單性和功能性之間取得平衡。隨著業務成長，可逐步遷移到 Schema 或 Database 隔離。
