# 報價→合約流程實作 (FUNC-001)

> **版本**: 1.0 | **更新日期**: 2026-02-02

---

## 狀態流程圖

```
                     ┌─────┐
                     │ 草稿 │ Draft
                     └──┬──┘
                        │ SEND
                        ▼
                     ┌─────┐
    ┌────────────────│ 已發送 │ Sent ─────────────┐
    │ EDIT           └──┬──┘                     │ EXPIRE
    │                   │ VIEW                    │
    ▼                   ▼                        ▼
┌─────┐            ┌─────┐                  ┌─────┐
│ 草稿 │ Draft      │ 已檢視 │ Viewed         │ 已過期 │ Expired
└─────┘            └──┬──┘                  └──┬──┘
                      │                        │ EDIT
          ┌──────────┼──────────┐              ▼
          │ ACCEPT   │ REJECT   │ EXPIRE    ┌─────┐
          ▼          ▼          ▼           │ 草稿 │
     ┌─────┐    ┌─────┐    ┌─────┐          └─────┘
     │ 已接受 │    │ 已拒絕 │    │ 已過期 │
     └──┬──┘    └──┬──┘    └─────┘
        │          │ EDIT
        │          ▼
        │       ┌─────┐
        │       │ 草稿 │
        │       └─────┘
        │ CONVERT_TO_CONTRACT
        ▼
     ┌─────┐
     │ 已轉換 │ Converted → 建立新合約
     └─────┘
```

---

## API 端點

### 報價管理

```typescript
// 狀態變更 API
PATCH /api/v1/quotations/:id/status

// 請求 Body
{
  "action": "SEND" | "ACCEPT" | "REJECT" | "EXPIRE" | "CONVERT_TO_CONTRACT",
  "comment"?: string
}

// 回應
{
  "id": "quot-001",
  "status": "sent",
  "previousStatus": "draft",
  "updatedAt": "2026-02-02T10:00:00Z"
}
```

### 轉換為合約

```typescript
// 報價轉合約 API
POST /api/v1/quotations/:id/convert

// 請求 Body
{
  "contractStartDate": "2026-03-01",
  "contractEndDate": "2026-06-30",
  "paymentTerms": "NET30",
  "additionalTerms"?: string
}

// 回應
{
  "contract": {
    "id": "cont-001",
    "quotationId": "quot-001",
    "status": "draft",
    ...
  },
  "quotation": {
    "id": "quot-001",
    "status": "converted"
  }
}
```

---

## 服務層實作

```typescript
// modules/quotations/quotations.service.ts
import { StateMachine, QUOTATION_TRANSITIONS } from '@common/state-machines';
import { EventTypes, DomainEvent } from '@common/events/domain-events';

@Injectable()
export class QuotationsService {
  constructor(
    @InjectRepository(Quotation)
    private quotationRepo: Repository<Quotation>,
    private contractsService: ContractsService,
    private eventEmitter: EventEmitter2,
  ) {}

  async changeStatus(
    id: string,
    action: QuotationEvent,
    userId: string,
    comment?: string,
  ): Promise<Quotation> {
    const quotation = await this.quotationRepo.findOneOrFail({ where: { id } });
    
    // 使用狀態機驗證轉換
    const machine = new StateMachine(quotation.status, QUOTATION_TRANSITIONS);
    
    if (!machine.canTransition(action)) {
      throw new BadRequestException(
        `無法從 ${quotation.status} 執行 ${action} 操作`
      );
    }
    
    const previousStatus = quotation.status;
    const newStatus = machine.transition(action);
    
    quotation.status = newStatus;
    quotation.statusHistory.push({
      from: previousStatus,
      to: newStatus,
      action,
      comment,
      changedBy: userId,
      changedAt: new Date(),
    });
    
    await this.quotationRepo.save(quotation);
    
    // 發送領域事件
    this.eventEmitter.emit(EventTypes.QUOTATION[action.toUpperCase()], {
      quotationId: id,
      previousStatus,
      newStatus,
      changedBy: userId,
    });
    
    return quotation;
  }

  async convertToContract(
    id: string,
    dto: ConvertToContractDto,
    userId: string,
  ): Promise<{ contract: Contract; quotation: Quotation }> {
    const quotation = await this.quotationRepo.findOneOrFail({
      where: { id },
      relations: ['items', 'client'],
    });
    
    if (quotation.status !== 'accepted') {
      throw new BadRequestException('只有已接受的報價可以轉換為合約');
    }
    
    // 建立合約
    const contract = await this.contractsService.createFromQuotation(
      quotation,
      dto,
      userId,
    );
    
    // 更新報價狀態
    quotation.status = 'converted';
    quotation.contractId = contract.id;
    quotation.convertedAt = new Date();
    await this.quotationRepo.save(quotation);
    
    // 發送事件
    this.eventEmitter.emit(EventTypes.CONTRACT.CREATED, {
      contractId: contract.id,
      quotationId: id,
      createdBy: userId,
    });
    
    return { contract, quotation };
  }
}
```

---

## 前端整合

```jsx
// components/QuotationActions.jsx
const QuotationActions = ({ quotation, onStatusChange }) => {
  const availableActions = getAvailableActions(quotation.status);
  
  return (
    <div className="flex gap-2">
      {availableActions.includes('SEND') && (
        <Button onClick={() => onStatusChange('SEND')}>
          發送報價
        </Button>
      )}
      {availableActions.includes('ACCEPT') && (
        <Button variant="success" onClick={() => onStatusChange('ACCEPT')}>
          標記為已接受
        </Button>
      )}
      {availableActions.includes('REJECT') && (
        <Button variant="danger" onClick={() => onStatusChange('REJECT')}>
          標記為已拒絕
        </Button>
      )}
      {availableActions.includes('CONVERT_TO_CONTRACT') && (
        <Button variant="primary" onClick={() => openConvertDialog()}>
          轉換為合約
        </Button>
      )}
    </div>
  );
};

// 狀態→可用操作映射
const STATUS_ACTIONS = {
  draft: ['SEND', 'EDIT'],
  sent: ['VIEW', 'EXPIRE'],
  viewed: ['ACCEPT', 'REJECT', 'EXPIRE'],
  accepted: ['CONVERT_TO_CONTRACT'],
  rejected: ['EDIT'],
  expired: ['EDIT'],
  converted: [],
};

const getAvailableActions = (status) => STATUS_ACTIONS[status] || [];
```

---

## 驗收測試

```typescript
// tests/quotation-workflow.spec.ts
describe('Quotation to Contract Workflow', () => {
  it('should complete full workflow: draft → sent → accepted → converted', async () => {
    // 1. 建立草稿
    const quotation = await createQuotation({ status: 'draft' });
    expect(quotation.status).toBe('draft');
    
    // 2. 發送
    await changeStatus(quotation.id, 'SEND');
    expect(quotation.status).toBe('sent');
    
    // 3. 模擬客戶檢視
    await changeStatus(quotation.id, 'VIEW');
    expect(quotation.status).toBe('viewed');
    
    // 4. 接受
    await changeStatus(quotation.id, 'ACCEPT');
    expect(quotation.status).toBe('accepted');
    
    // 5. 轉換為合約
    const result = await convertToContract(quotation.id, { ... });
    expect(quotation.status).toBe('converted');
    expect(result.contract).toBeTruthy();
    expect(result.contract.quotationId).toBe(quotation.id);
  });
});
```
