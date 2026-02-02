# 測試資料管理策略 (TEST-004)

> **版本**: 1.0 | **更新日期**: 2026-02-02

---

## 策略概述

| 環境 | 資料策略 | 隔離方式 |
|:-----|:---------|:---------|
| Unit Test | Mock Repository | 無 DB 連線 |
| Integration | Test DB + Seeder | 每測試重置 |
| E2E | Staging DB + Fixtures | 測試專用帳號 |

---

## Seeder 腳本

### 基礎種子資料

```typescript
// apps/api/src/database/seeds/base.seed.ts
import { DataSource } from 'typeorm';

export async function seedBase(dataSource: DataSource) {
  const userRepo = dataSource.getRepository('User');
  const clientRepo = dataSource.getRepository('Client');
  const projectRepo = dataSource.getRepository('Project');

  // 1. 建立測試用戶
  const users = await userRepo.save([
    {
      id: 'test-admin-001',
      email: 'admin@test.senteng.co',
      name: 'Test Admin',
      role: 'admin',
      password: await hashPassword('Test@1234'),
    },
    {
      id: 'test-user-001',
      email: 'user@test.senteng.co',
      name: 'Test User',
      role: 'editor',
      password: await hashPassword('Test@1234'),
    },
    {
      id: 'test-viewer-001',
      email: 'viewer@test.senteng.co',
      name: 'Test Viewer',
      role: 'viewer',
      password: await hashPassword('Test@1234'),
    },
  ]);

  // 2. 建立測試客戶
  const clients = await clientRepo.save([
    {
      id: 'test-client-001',
      name: '測試客戶 A',
      phone: '0912345678',
      email: 'clienta@test.com',
    },
    {
      id: 'test-client-002',
      name: '測試客戶 B',
      phone: '0923456789',
      email: 'clientb@test.com',
    },
  ]);

  // 3. 建立測試專案
  const projects = await projectRepo.save([
    {
      id: 'test-project-001',
      name: '測試專案 Alpha',
      clientId: 'test-client-001',
      ownerId: 'test-admin-001',
      status: 'in_progress',
      budget: 1000000,
    },
    {
      id: 'test-project-002',
      name: '測試專案 Beta',
      clientId: 'test-client-002',
      ownerId: 'test-user-001',
      status: 'planning',
      budget: 500000,
    },
  ]);

  console.log(`✅ Seeded: ${users.length} users, ${clients.length} clients, ${projects.length} projects`);
}
```

### 財務種子資料

```typescript
// apps/api/src/database/seeds/finance.seed.ts
export async function seedFinance(dataSource: DataSource) {
  const accountRepo = dataSource.getRepository('Account');
  const transactionRepo = dataSource.getRepository('Transaction');

  // 建立測試帳戶
  await accountRepo.save([
    {
      id: 'test-account-001',
      name: '測試銀行帳戶',
      type: '銀行帳戶',
      balance: 500000,
    },
    {
      id: 'test-account-002',
      name: '測試零用金',
      type: '現金',
      balance: 50000,
    },
  ]);

  // 建立測試交易
  const transactions = [];
  for (let i = 0; i < 20; i++) {
    transactions.push({
      id: `test-txn-${i.toString().padStart(3, '0')}`,
      type: i % 2 === 0 ? '收入' : '支出',
      amount: Math.round(Math.random() * 100000),
      date: new Date(2026, 1, i + 1),
      description: `測試交易 ${i + 1}`,
      projectId: i % 2 === 0 ? 'test-project-001' : 'test-project-002',
    });
  }
  await transactionRepo.save(transactions);

  console.log(`✅ Seeded: 2 accounts, ${transactions.length} transactions`);
}
```

---

## 執行命令

```bash
# 執行所有種子
npm run seed

# 執行特定種子
npm run seed:base
npm run seed:finance

# 重置測試資料庫
npm run db:test:reset
```

### package.json 腳本

```json
{
  "scripts": {
    "seed": "ts-node -r tsconfig-paths/register src/database/run-seeds.ts",
    "seed:base": "ts-node -r tsconfig-paths/register src/database/seeds/base.seed.ts",
    "seed:finance": "ts-node -r tsconfig-paths/register src/database/seeds/finance.seed.ts",
    "db:test:reset": "npm run db:drop:test && npm run db:migrate:test && npm run seed"
  }
}
```

---

## 測試隔離策略

### 單元測試 (Jest)

```typescript
// 使用 Mock Repository
const mockRepository = {
  find: jest.fn().mockResolvedValue([mockProject]),
  findOne: jest.fn().mockResolvedValue(mockProject),
  save: jest.fn().mockImplementation(entity => Promise.resolve({ ...entity, id: 'new-id' })),
  delete: jest.fn().mockResolvedValue({ affected: 1 }),
};
```

### 整合測試

```typescript
// test/setup.ts
beforeAll(async () => {
  // 連接測試資料庫
  testDataSource = new DataSource({
    type: 'postgres',
    database: 'senteng_test',
    synchronize: true,
  });
  await testDataSource.initialize();
});

beforeEach(async () => {
  // 每個測試前清空資料
  await testDataSource.synchronize(true);
  await seedBase(testDataSource);
});

afterAll(async () => {
  await testDataSource.destroy();
});
```

### E2E 測試

```typescript
// 使用固定測試帳號
const testCredentials = {
  admin: { email: 'admin@test.senteng.co', password: 'Test@1234' },
  user: { email: 'user@test.senteng.co', password: 'Test@1234' },
  viewer: { email: 'viewer@test.senteng.co', password: 'Test@1234' },
};
```

---

## 資料工廠

```typescript
// test/factories/project.factory.ts
import { faker } from '@faker-js/faker';

export function createProjectFixture(overrides = {}) {
  return {
    id: faker.string.uuid(),
    name: faker.company.name() + ' 專案',
    status: faker.helpers.arrayElement(['planning', 'in_progress', 'completed']),
    budget: faker.number.int({ min: 100000, max: 10000000 }),
    startDate: faker.date.past(),
    ...overrides,
  };
}

// 使用方式
const project = createProjectFixture({ status: 'in_progress' });
```

---

## CI/CD 整合

```yaml
# .github/workflows/test.yml
jobs:
  test:
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: senteng_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432

    steps:
      - name: Run migrations
        run: npm run db:migrate:test

      - name: Seed test data
        run: npm run seed

      - name: Run tests
        run: npm run test:ci
```
