# E2E 測試設定 (TEST-002)

> **版本**: 1.0 | **更新日期**: 2026-02-02

---

## 框架選擇: Playwright

選擇 Playwright 的原因：
- 跨瀏覽器支援 (Chromium, Firefox, WebKit)
- 原生 auto-waiting 機制
- 網路攔截和 Mock 能力
- 良好的 CI/CD 整合

---

## 安裝設定

```bash
# 安裝 Playwright
npm init playwright@latest

# 專案結構
apps/web/
├── playwright.config.ts
├── tests/
│   ├── setup/
│   │   ├── auth.setup.ts
│   │   └── global-setup.ts
│   ├── e2e/
│   │   ├── auth.spec.ts
│   │   ├── projects.spec.ts
│   │   ├── finance.spec.ts
│   │   ├── quotations.spec.ts
│   │   └── clients.spec.ts
│   └── fixtures/
│       └── test-data.ts
└── playwright-report/
```

---

## 配置檔

```typescript
// apps/web/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://staging.senteng.co',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // 認證設定
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // 主要測試
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
    },
  ],
});
```

---

## 認證設定

```typescript
// tests/setup/auth.setup.ts
import { test as setup, expect } from '@playwright/test';
import path from 'path';

const adminAuthFile = path.join(__dirname, './auth/admin.json');
const userAuthFile = path.join(__dirname, './auth/user.json');

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', 'admin@test.senteng.co');
  await page.fill('[data-testid="password-input"]', 'Test@1234');
  await page.click('[data-testid="login-button"]');
  await expect(page).toHaveURL('/dashboard');
  await page.context().storageState({ path: adminAuthFile });
});

setup('authenticate as user', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', 'user@test.senteng.co');
  await page.fill('[data-testid="password-input"]', 'Test@1234');
  await page.click('[data-testid="login-button"]');
  await expect(page).toHaveURL('/dashboard');
  await page.context().storageState({ path: userAuthFile });
});
```

---

## Top 5 Happy Path 測試

### 1. 登入流程

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'admin@test.senteng.co');
    await page.fill('[data-testid="password-input"]', 'Test@1234');
    await page.click('[data-testid="login-button"]');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'wrong@email.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');
    
    await expect(page.locator('[data-testid="error-message"]')).toContainText('帳號或密碼錯誤');
  });
});
```

### 2. 專案建立流程

```typescript
// tests/e2e/projects.spec.ts
test.describe('Project Management', () => {
  test.use({ storageState: './tests/setup/auth/admin.json' });

  test('should create a new project', async ({ page }) => {
    await page.goto('/projects');
    await page.click('[data-testid="new-project-btn"]');
    
    await page.fill('[data-testid="project-name"]', 'E2E 測試專案');
    await page.selectOption('[data-testid="client-select"]', 'test-client-001');
    await page.fill('[data-testid="project-budget"]', '1000000');
    await page.click('[data-testid="submit-btn"]');
    
    await expect(page.locator('.toast-success')).toContainText('專案建立成功');
    await expect(page.locator('table')).toContainText('E2E 測試專案');
  });
});
```

### 3. 財務交易紀錄

```typescript
// tests/e2e/finance.spec.ts
test.describe('Finance Transactions', () => {
  test.use({ storageState: './tests/setup/auth/admin.json' });

  test('should record income transaction', async ({ page }) => {
    await page.goto('/finance');
    await page.click('[data-testid="add-transaction-btn"]');
    
    await page.selectOption('[data-testid="txn-type"]', '收入');
    await page.fill('[data-testid="txn-amount"]', '50000');
    await page.fill('[data-testid="txn-description"]', 'E2E 測試收入');
    await page.click('[data-testid="submit-btn"]');
    
    await expect(page.locator('.toast-success')).toBeVisible();
  });
});
```

### 4. 報價單建立

```typescript
// tests/e2e/quotations.spec.ts
test.describe('Quotation Workflow', () => {
  test('should create and send quotation', async ({ page }) => {
    await page.goto('/quotations/new');
    
    // 填寫基本資訊
    await page.selectOption('[data-testid="client-select"]', 'test-client-001');
    
    // 新增項目
    await page.click('[data-testid="add-item-btn"]');
    await page.fill('[data-testid="item-name-0"]', '設計服務');
    await page.fill('[data-testid="item-qty-0"]', '1');
    await page.fill('[data-testid="item-price-0"]', '100000');
    
    // 儲存
    await page.click('[data-testid="save-draft-btn"]');
    await expect(page.locator('.toast-success')).toContainText('已儲存');
    
    // 發送
    await page.click('[data-testid="send-quotation-btn"]');
    await expect(page.locator('[data-testid="status-badge"]')).toContainText('已發送');
  });
});
```

### 5. 客戶搜尋

```typescript
// tests/e2e/clients.spec.ts
test.describe('Client Search', () => {
  test('should search and find client', async ({ page }) => {
    await page.goto('/clients');
    
    await page.fill('[data-testid="search-input"]', '測試客戶 A');
    await page.keyboard.press('Enter');
    
    await expect(page.locator('table tbody tr')).toHaveCount(1);
    await expect(page.locator('table')).toContainText('測試客戶 A');
  });
});
```

---

## CI/CD 整合

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  pull_request:
    branches: [main, develop]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps
      
      - name: Run E2E Tests
        run: npx playwright test
        env:
          BASE_URL: https://staging.senteng.co
      
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

## 執行命令

```bash
# 執行所有測試
npx playwright test

# 執行特定檔案
npx playwright test auth.spec.ts

# UI 模式
npx playwright test --ui

# 生成報告
npx playwright show-report
```
