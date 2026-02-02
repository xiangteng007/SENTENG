# 擴充性架構文件 (DOC-003)

> **版本**: 1.0 | **更新日期**: 2026-02-02

---

## 架構設計理念

SENTENG ERP 採用 **模組化鬆耦合架構**，通過以下機制實現可擴充性：

1. **領域事件總線** - 模組間異步通訊
2. **擴充點註冊表** - 外掛式功能擴展
3. **自訂欄位框架** - 資料模型彈性
4. **工作流程 Hooks** - 業務邏輯注入

---

## 領域事件總線

### 架構圖

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│ Quotations  │       │  Contracts  │       │  Invoices   │
│   Module    │       │   Module    │       │   Module    │
└──────┬──────┘       └──────┬──────┘       └──────┬──────┘
       │                     │                     │
       │ publish             │ publish             │ publish
       ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Event Bus (EventEmitter2)                │
│  "quotation.accepted"   "contract.signed"   "invoice.paid"  │
└─────────────────────────────────────────────────────────────┘
       │                     │                     │
       │ subscribe           │ subscribe           │ subscribe
       ▼                     ▼                     ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│ Contracts   │       │ Finance     │       │ Notifications│
│   Module    │       │   Module    │       │   Module     │
└─────────────┘       └─────────────┘       └─────────────┘
```

### 事件命名規範

```
{domain}.{entity}.{action}

範例:
- quotation.created
- contract.signed
- invoice.paid
- payment.received
- project.started
```

### 使用方式

```typescript
// 發布事件
@Injectable()
export class QuotationsService {
  constructor(private eventEmitter: EventEmitter2) {}

  async accept(id: string) {
    const quotation = await this.updateStatus(id, 'accepted');
    
    this.eventEmitter.emit('quotation.accepted', {
      quotationId: id,
      clientId: quotation.clientId,
      totalAmount: quotation.totalAmount,
    });
  }
}

// 訂閱事件
@Injectable()
export class ContractsService {
  @OnEvent('quotation.accepted')
  async handleQuotationAccepted(payload: QuotationAcceptedEvent) {
    // 自動建立合約草稿
    await this.createDraft({
      quotationId: payload.quotationId,
      clientId: payload.clientId,
    });
  }
}
```

---

## 擴充點系統

詳見 [Extension Points 註冊表](./extension-points.md)

### 快速概覽

| 擴充點 | 用途 |
|:-------|:-----|
| CustomFieldsExtension | 實體自訂欄位 |
| WorkflowHooksExtension | 流程節點 Hook |
| ReportGeneratorExtension | 自訂報表 |

---

## 模組化設計

### 層次架構

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│   Controllers, DTOs, Swagger, Error Handlers                │
├─────────────────────────────────────────────────────────────┤
│                    Application Layer                        │
│   Services, Use Cases, Validation                          │
├─────────────────────────────────────────────────────────────┤
│                     Domain Layer                            │
│   Entities, Value Objects, Domain Events, State Machines    │
├─────────────────────────────────────────────────────────────┤
│                   Infrastructure Layer                      │
│   Repositories, External APIs, Database, Cache              │
└─────────────────────────────────────────────────────────────┘
```

### 模組邊界

每個業務模組獨立封裝：

```
modules/
├── quotations/
│   ├── quotations.module.ts     # 模組定義
│   ├── quotations.controller.ts # 控制器
│   ├── quotations.service.ts    # 服務
│   ├── entities/                # 實體
│   │   └── quotation.entity.ts
│   ├── dto/                     # 資料傳輸物件
│   │   ├── create-quotation.dto.ts
│   │   └── update-quotation.dto.ts
│   └── events/                  # 領域事件
│       └── quotation-accepted.event.ts
```

---

## 添加新功能指南

### 場景 1: 添加新實體欄位

```typescript
// 1. 更新 Entity
@Entity()
export class Project {
  @Column({ nullable: true })
  newField: string;
}

// 2. 建立 Migration
// npm run migration:generate -- -n AddNewField

// 3. 更新 DTO
export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  newField?: string;
}

// 4. 更新 Service (如需要)
```

### 場景 2: 添加新業務流程

```typescript
// 1. 定義狀態機 (common/state-machines/)
export const NEW_WORKFLOW_TRANSITIONS = [...];

// 2. 建立事件類型 (common/events/)
export const NewWorkflowEvents = {
  STARTED: 'new-workflow.started',
  COMPLETED: 'new-workflow.completed',
};

// 3. 實作服務
@Injectable()
export class NewWorkflowService {
  async start() { /* ... */ }
  async complete() { /* ... */ }
}

// 4. 添加 API 端點
@Controller('new-workflow')
export class NewWorkflowController { /* ... */ }
```

### 場景 3: 整合外部服務

```typescript
// 1. 建立 Connector 模組
@Module({
  providers: [ExternalServiceConnector],
  exports: [ExternalServiceConnector],
})
export class ExternalServiceModule {}

// 2. 實作 Connector
@Injectable()
export class ExternalServiceConnector {
  async sync() { /* ... */ }
}

// 3. 在需要的模組中注入
@Module({
  imports: [ExternalServiceModule],
})
export class QuotationsModule {}
```

---

## 最佳實踐

1. **保持模組獨立** - 模組間通過事件或注入服務通訊
2. **優先使用事件** - 跨模組操作使用領域事件
3. **擴充優於修改** - 使用 Extension Points 而非直接修改核心
4. **文件化變更** - 所有架構變更需更新文件
