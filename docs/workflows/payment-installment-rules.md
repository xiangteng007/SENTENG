# 部分付款/分期規則 (FUNC-003)

> **版本**: 1.0 | **更新日期**: 2026-02-02

---

## 付款方式

| 類型 | 說明 | 使用場景 |
|:-----|:-----|:---------|
| 一次付清 | 單一付款結清 | 小額專案 |
| 分期付款 | 固定期數等額 | 大型裝修 |
| 里程碑付款 | 依進度階段 | 工程專案 |
| 自訂付款 | 彈性安排 | 特殊協議 |

---

## 分期付款設定

### 資料結構

```typescript
interface PaymentPlan {
  id: string;
  contractId: string;
  invoiceId?: string;
  planType: 'installment' | 'milestone' | 'custom';
  totalAmount: number;
  currency: string;
  
  installments: PaymentInstallment[];
  
  createdAt: Date;
  createdBy: string;
}

interface PaymentInstallment {
  id: string;
  sequence: number;           // 第幾期
  amount: number;             // 應付金額
  percentage?: number;        // 佔總額百分比
  dueDate: Date;              // 到期日
  
  status: 'pending' | 'due' | 'paid' | 'overdue';
  paidAmount?: number;        // 實付金額
  paidDate?: Date;            // 實付日期
  paymentId?: string;         // 關聯付款
  
  // 里程碑專用
  milestoneName?: string;     // 例如: "設計完成"
  milestoneCondition?: string;// 驗收條件
  isApproved?: boolean;       // 業主確認
}
```

### 範例配置

```json
{
  "planType": "installment",
  "totalAmount": 1000000,
  "installments": [
    {
      "sequence": 1,
      "percentage": 30,
      "amount": 300000,
      "dueDate": "2026-03-01",
      "milestoneName": "訂金"
    },
    {
      "sequence": 2,
      "percentage": 40,
      "amount": 400000,
      "dueDate": "2026-04-15",
      "milestoneName": "工程中期"
    },
    {
      "sequence": 3,
      "percentage": 30,
      "amount": 300000,
      "dueDate": "2026-06-01",
      "milestoneName": "完工驗收"
    }
  ]
}
```

---

## API 設計

### 建立付款計畫

```typescript
POST /api/v1/contracts/:id/payment-plan

{
  "planType": "installment",
  "installmentCount": 3,
  "percentages": [30, 40, 30],
  "startDate": "2026-03-01",
  "intervalDays": 45
}

// 回應
{
  "paymentPlan": { ... },
  "installments": [
    { "sequence": 1, "amount": 300000, "dueDate": "2026-03-01" },
    { "sequence": 2, "amount": 400000, "dueDate": "2026-04-15" },
    { "sequence": 3, "amount": 300000, "dueDate": "2026-05-30" }
  ]
}
```

### 紀錄部分付款

```typescript
POST /api/v1/installments/:id/payment

{
  "amount": 300000,
  "paymentDate": "2026-03-01",
  "paymentMethod": "BANK_TRANSFER",
  "reference": "匯款帳號末四碼 1234"
}
```

### 核准里程碑

```typescript
PATCH /api/v1/installments/:id/approve

{
  "isApproved": true,
  "approvedBy": "user-001",
  "notes": "設計圖已確認"
}
```

---

## 服務層實作

```typescript
// modules/payments/payment-plan.service.ts
@Injectable()
export class PaymentPlanService {
  async createInstallmentPlan(
    contractId: string,
    dto: CreatePaymentPlanDto,
    userId: string,
  ): Promise<PaymentPlan> {
    const contract = await this.contractRepo.findOneOrFail({
      where: { id: contractId },
    });
    
    // 計算分期
    const installments = this.calculateInstallments(
      contract.totalAmount,
      dto.installmentCount,
      dto.percentages,
      dto.startDate,
      dto.intervalDays,
    );
    
    // 建立計畫
    const plan = this.planRepo.create({
      contractId,
      planType: dto.planType,
      totalAmount: contract.totalAmount,
      installments,
      createdBy: userId,
    });
    
    return this.planRepo.save(plan);
  }

  async recordPayment(
    installmentId: string,
    dto: RecordPaymentDto,
    userId: string,
  ): Promise<PaymentInstallment> {
    const installment = await this.installmentRepo.findOneOrFail({
      where: { id: installmentId },
      relations: ['paymentPlan'],
    });
    
    // 驗證金額
    const remaining = installment.amount - (installment.paidAmount || 0);
    if (dto.amount > remaining) {
      throw new BadRequestException(`本期剩餘應付 ${remaining}`);
    }
    
    // 更新付款紀錄
    installment.paidAmount = (installment.paidAmount || 0) + dto.amount;
    installment.paidDate = dto.paymentDate;
    
    // 更新狀態
    if (installment.paidAmount >= installment.amount) {
      installment.status = 'paid';
    }
    
    await this.installmentRepo.save(installment);
    
    // 建立財務交易
    await this.financeService.createTransaction({
      type: '收入',
      amount: dto.amount,
      category: '工程款',
      contractId: installment.paymentPlan.contractId,
      description: `第 ${installment.sequence} 期付款`,
    });
    
    // 發送事件
    this.eventEmitter.emit(EventTypes.PAYMENT.PARTIAL, {
      installmentId,
      amount: dto.amount,
    });
    
    return installment;
  }

  // 每日檢查逾期 (排程任務)
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkOverdueInstallments() {
    const overdueInstallments = await this.installmentRepo.find({
      where: {
        status: In(['pending', 'due']),
        dueDate: LessThan(new Date()),
      },
    });
    
    for (const installment of overdueInstallments) {
      installment.status = 'overdue';
      await this.installmentRepo.save(installment);
      
      // 發送逾期通知
      this.notificationService.send({
        type: 'PAYMENT_OVERDUE',
        targetId: installment.id,
      });
    }
  }
}
```

---

## 前端 UI

### 付款進度視覺化

```jsx
const PaymentProgress = ({ plan }) => {
  const paidPercentage = (plan.paidAmount / plan.totalAmount) * 100;
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm">
        <span>已付: NT$ {plan.paidAmount.toLocaleString()}</span>
        <span>總額: NT$ {plan.totalAmount.toLocaleString()}</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className="bg-green-500 h-3 rounded-full transition-all"
          style={{ width: `${paidPercentage}%` }}
        />
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        {plan.installments.map(inst => (
          <InstallmentCard 
            key={inst.id} 
            installment={inst}
            onPayment={handlePayment}
          />
        ))}
      </div>
    </div>
  );
};
```

---

## 驗收標準

- [ ] 可建立 3、6、12 期分期計畫
- [ ] 可建立里程碑付款計畫
- [ ] 支援部分付款紀錄
- [ ] 逾期自動標記並通知
- [ ] 付款進度可視化
- [ ] 與財務模組交易連動
