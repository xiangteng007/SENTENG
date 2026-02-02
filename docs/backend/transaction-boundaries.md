# 交易邊界規範 (BE-002)

> **版本**: 1.0 | **更新日期**: 2026-02-02

---

## 概述

資料庫交易 (Transaction) 是確保資料一致性的關鍵機制。本文件定義 SENTENG ERP 的交易邊界規範。

---

## 交易原則

### ACID 屬性

- **Atomicity**: 全成功或全失敗
- **Consistency**: 維持資料完整性
- **Isolation**: 並發隔離
- **Durability**: 永久保存

### 何時需要交易

| 場景 | 需要交易 |
|:-----|:--------:|
| 單一 INSERT/UPDATE | ❌ |
| 多表連動更新 | ✅ |
| 餘額變動 | ✅ |
| 庫存異動 | ✅ |
| 狀態流轉 + 記錄 | ✅ |

---

## 實作方式

### 方式 1: TypeORM QueryRunner (推薦)

```typescript
@Injectable()
export class FinanceService {
  constructor(
    @InjectConnection()
    private connection: Connection,
  ) {}

  async transfer(fromId: string, toId: string, amount: number) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. 扣除來源帳戶
      await queryRunner.manager.decrement(
        Account, { id: fromId }, 'balance', amount
      );

      // 2. 增加目標帳戶
      await queryRunner.manager.increment(
        Account, { id: toId }, 'balance', amount
      );

      // 3. 建立交易紀錄
      await queryRunner.manager.insert(Transaction, {
        fromAccountId: fromId,
        toAccountId: toId,
        amount,
        type: 'transfer',
      });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
```

### 方式 2: @Transaction 裝飾器

```typescript
// common/decorators/transactional.decorator.ts
import { applyDecorators, SetMetadata } from '@nestjs/common';

export const TRANSACTIONAL_KEY = 'transactional';

export function Transactional(options?: TransactionOptions): MethodDecorator {
  return applyDecorators(
    SetMetadata(TRANSACTIONAL_KEY, options || {}),
  );
}

// 搭配 Interceptor 使用
@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(@InjectConnection() private connection: Connection) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const isTransactional = Reflect.getMetadata(
      TRANSACTIONAL_KEY, 
      context.getHandler()
    );

    if (!isTransactional) {
      return next.handle();
    }

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await next.handle().toPromise();
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

// 使用
@Injectable()
export class PaymentService {
  @Transactional()
  async processPayment(dto: ProcessPaymentDto) {
    // 所有操作自動包在交易中
  }
}
```

### 方式 3: EntityManager.transaction

```typescript
async createWithItems(dto: CreateOrderDto) {
  return this.entityManager.transaction(async (manager) => {
    // 1. 建立訂單
    const order = manager.create(Order, {
      clientId: dto.clientId,
      status: 'pending',
    });
    await manager.save(order);

    // 2. 建立項目
    const items = dto.items.map(item => 
      manager.create(OrderItem, { ...item, orderId: order.id })
    );
    await manager.save(items);

    return order;
  });
}
```

---

## 隔離等級

PostgreSQL 預設使用 `READ COMMITTED`。

```typescript
// 需要更高隔離等級時
await queryRunner.startTransaction('SERIALIZABLE');
```

| 等級 | 髒讀 | 不可重複讀 | 幻讀 | 使用場景 |
|:-----|:----:|:----------:|:----:|:---------|
| READ UNCOMMITTED | ✓ | ✓ | ✓ | 不建議 |
| READ COMMITTED | ✗ | ✓ | ✓ | 預設 |
| REPEATABLE READ | ✗ | ✗ | ✓ | 報表 |
| SERIALIZABLE | ✗ | ✗ | ✗ | 財務 |

---

## 鎖定策略

### 樂觀鎖 (Optimistic Lock)

```typescript
@Entity()
export class Account {
  @VersionColumn()
  version: number;
}

// 更新時自動檢查版本
try {
  await repository.save(entity);
} catch (error) {
  if (error instanceof OptimisticLockVersionMismatchError) {
    throw new ConflictException('資料已被其他人修改');
  }
}
```

### 悲觀鎖 (Pessimistic Lock)

```typescript
// 讀取時鎖定 (FOR UPDATE)
const account = await queryRunner.manager.findOne(Account, {
  where: { id },
  lock: { mode: 'pessimistic_write' },
});
```

---

## 最佳實踐

1. **交易範圍最小化** - 只包含必要操作
2. **避免長時間交易** - 減少鎖定時間
3. **先讀後寫** - 批量讀取再批量寫入
4. **統一錯誤處理** - 確保 rollback
5. **記錄交易日誌** - 便於追蹤問題

---

## 需要交易的操作清單

| 模組 | 操作 | 原因 |
|:-----|:-----|:-----|
| Finance | 轉帳 | 餘額一致性 |
| Finance | 付款紀錄 | 發票+付款連動 |
| Inventory | 庫存異動 | 庫存+紀錄連動 |
| Quotation | 轉換合約 | 狀態+新建連動 |
| Invoice | 作廢 | 狀態+審計連動 |
| Project | 建立 | 專案+成員連動 |
