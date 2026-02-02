# 發票作廢/沖銷流程 (FUNC-002)

> **版本**: 1.0 | **更新日期**: 2026-02-02

---

## 狀態機

```
        ┌─────┐
        │ 草稿 │ Draft
        └──┬──┘
           │ ISSUE
           ▼
        ┌─────┐
        │ 已開立 │ Issued ──────────────────┐
        └──┬──┘                            │
           │ SEND                          │ VOID
           ▼                               │
        ┌─────┐                            │
   ┌────│ 已寄送 │ Sent ─────────┬─────────┤
   │    └──┬──┘               │         │
   │       │ RECORD_PAYMENT   │ VOID    │
   │       ▼                  ▼         │
   │    ┌─────┐           ┌─────┐       │
   │    │ 部分付款 │         │ 作廢 │ Void  │
   │    └──┬──┘           └─────┘       │
   │       │ RECORD_PAYMENT             │
   │       ▼                            │
   │    ┌─────┐                         │
   │    │ 已付清 │ Paid ─────┐           │
   │    └─────┘            │ CREDIT    │
   │                       ▼           │
   │                    ┌─────┐        │
   │                    │ 已沖銷 │ Credited
   │                    └─────┘
   │
   │ MARK_OVERDUE
   ▼
┌─────┐
│ 逾期 │ Overdue ──────────┐
└──┬──┘                   │
   │ RECORD_PAYMENT       │ VOID
   ▼                      ▼
┌─────┐               ┌─────┐
│ 已付清 │               │ 作廢 │
└─────┘               └─────┘
```

---

## 作廢流程 (Void)

### API 定義

```typescript
// 作廢發票
POST /api/v1/invoices/:id/void

// 請求
{
  "reason": "客戶取消訂單",
  "voidType": "CLIENT_CANCEL" | "DUPLICATE" | "ERROR" | "OTHER",
  "approvedBy"?: string,  // 大額需主管核准
  "attachments"?: string[]
}

// 回應
{
  "invoice": {
    "id": "inv-001",
    "status": "void",
    "voidedAt": "2026-02-02T10:00:00Z",
    "voidReason": "客戶取消訂單"
  },
  "auditLog": {
    "id": "audit-xxx",
    "action": "INVOICE_VOIDED"
  }
}
```

### 服務實作

```typescript
// modules/invoices/invoices.service.ts
async voidInvoice(
  id: string,
  dto: VoidInvoiceDto,
  userId: string,
): Promise<Invoice> {
  const invoice = await this.invoiceRepo.findOneOrFail({ where: { id } });
  
  // 驗證可作廢狀態
  const voidableStates: InvoiceState[] = ['issued', 'sent', 'overdue'];
  if (!voidableStates.includes(invoice.status)) {
    throw new BadRequestException(
      `發票狀態 ${invoice.status} 不可作廢`
    );
  }
  
  // 已有付款紀錄需特殊處理
  if (invoice.paidAmount > 0) {
    throw new BadRequestException(
      '發票已有付款紀錄，請使用沖銷功能'
    );
  }
  
  // 大額需核准
  if (invoice.totalAmount > 100000 && !dto.approvedBy) {
    throw new BadRequestException('金額超過 10 萬需主管核准');
  }
  
  // 更新狀態
  invoice.status = 'void';
  invoice.voidedAt = new Date();
  invoice.voidedBy = userId;
  invoice.voidReason = dto.reason;
  invoice.voidType = dto.voidType;
  
  await this.invoiceRepo.save(invoice);
  
  // 發送事件
  this.eventEmitter.emit(EventTypes.INVOICE.VOIDED, {
    invoiceId: id,
    reason: dto.reason,
    voidedBy: userId,
  });
  
  return invoice;
}
```

---

## 沖銷流程 (Credit Note)

### 場景

| 情況 | 處理方式 |
|:-----|:---------|
| 全額退款 | 開立等額折讓單 |
| 部分退款 | 開立部分折讓單 |
| 品項錯誤 | 作廢重開 |
| 金額錯誤 | 開立差額折讓單 |

### API 定義

```typescript
// 建立折讓單/沖銷
POST /api/v1/invoices/:id/credit

// 請求
{
  "creditAmount": 50000,
  "reason": "退貨處理",
  "items": [
    {
      "originalItemId": "item-001",
      "creditQuantity": 2,
      "creditAmount": 50000
    }
  ],
  "refundMethod": "BANK_TRANSFER" | "CHECK" | "OFFSET",
  "bankAccount"?: string
}

// 回應
{
  "creditNote": {
    "id": "cn-001",
    "invoiceId": "inv-001",
    "creditAmount": 50000,
    "status": "issued"
  },
  "invoice": {
    "id": "inv-001",
    "status": "credited",
    "creditedAmount": 50000
  }
}
```

### 服務實作

```typescript
async createCreditNote(
  invoiceId: string,
  dto: CreateCreditNoteDto,
  userId: string,
): Promise<{ creditNote: CreditNote; invoice: Invoice }> {
  const invoice = await this.invoiceRepo.findOneOrFail({
    where: { id: invoiceId },
    relations: ['items', 'payments'],
  });
  
  // 只有已付款發票可沖銷
  if (invoice.status !== 'paid') {
    throw new BadRequestException('只有已付款發票可開立折讓單');
  }
  
  // 驗證沖銷金額
  const maxCredit = invoice.paidAmount - invoice.creditedAmount;
  if (dto.creditAmount > maxCredit) {
    throw new BadRequestException(
      `最大可沖銷金額為 ${maxCredit}`
    );
  }
  
  // 產生折讓單號
  const creditNumber = await this.generateCreditNumber();
  
  // 建立折讓單
  const creditNote = this.creditNoteRepo.create({
    creditNumber,
    invoiceId,
    creditAmount: dto.creditAmount,
    reason: dto.reason,
    items: dto.items,
    refundMethod: dto.refundMethod,
    issuedBy: userId,
    issuedAt: new Date(),
  });
  
  await this.creditNoteRepo.save(creditNote);
  
  // 更新發票
  invoice.creditedAmount = (invoice.creditedAmount || 0) + dto.creditAmount;
  if (invoice.creditedAmount >= invoice.paidAmount) {
    invoice.status = 'credited';
  }
  await this.invoiceRepo.save(invoice);
  
  // 處理退款 (如適用)
  if (dto.refundMethod === 'BANK_TRANSFER') {
    await this.financeService.createRefundTransaction({
      creditNoteId: creditNote.id,
      amount: dto.creditAmount,
      bankAccount: dto.bankAccount,
    });
  }
  
  return { creditNote, invoice };
}
```

---

## 審計日誌

所有作廢/沖銷操作自動記錄：

```typescript
{
  "action": "INVOICE_VOIDED",
  "entityType": "Invoice",
  "entityId": "inv-001",
  "changes": {
    "status": { "from": "sent", "to": "void" },
    "voidReason": "客戶取消"
  },
  "performedBy": "user-001",
  "performedAt": "2026-02-02T10:00:00Z",
  "ipAddress": "203.xx.xx.xx"
}
```

---

## 驗收標準

- [ ] 已開立/已寄送/逾期發票可作廢
- [ ] 已付款發票無法直接作廢
- [ ] 已付款發票可開立折讓單
- [ ] 大額作廢需主管核准
- [ ] 所有操作有審計紀錄
