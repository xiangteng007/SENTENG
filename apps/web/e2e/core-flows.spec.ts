/**
 * Playwright E2E Test - Login Flow
 * Expert Panel v4.9: E2E Automation Engineer 建議
 */

import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login page correctly', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/SENTENG/);
    
    // Check login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await expect(page.locator('.error-message, [role="alert"]')).toBeVisible();
  });

  test('should redirect to dashboard after successful login', async ({ page }) => {
    // Use test credentials
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@senteng.app');
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'testpassword');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL('**/');
    
    // Check dashboard elements
    await expect(page.locator('text=儀表板')).toBeVisible();
  });

  test('should handle Google OAuth button', async ({ page }) => {
    const googleButton = page.locator('button:has-text("Google")');
    await expect(googleButton).toBeVisible();
    
    // Click should open OAuth popup (we just verify the button works)
    // In real tests, you'd mock the OAuth flow
  });
});

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login first (use storage state in real tests)
    await page.goto('/');
  });

  test('should display stats cards', async ({ page }) => {
    // Look for stat card elements
    const statCards = page.locator('[class*="stat"], [class*="card"]');
    await expect(statCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate using sidebar', async ({ page }) => {
    // Click on a sidebar item
    await page.click('text=專案管理');
    await page.waitForURL('**/projects');
    
    // Verify navigation
    await expect(page.locator('h1:has-text("專案")')).toBeVisible();
  });
});

test.describe('Projects CRUD', () => {
  test('should create new project', async ({ page }) => {
    await page.goto('/projects');
    
    // Click add button
    await page.click('button:has-text("新增"), button:has-text("Add")');
    
    // Fill form
    await page.fill('input[name="name"], input[placeholder*="名稱"]', 'Test Project');
    await page.fill('input[name="budget"], input[placeholder*="預算"]', '100000');
    
    // Submit
    await page.click('button[type="submit"], button:has-text("確認")');
    
    // Verify created
    await expect(page.locator('text=Test Project')).toBeVisible();
  });

  test('should edit existing project', async ({ page }) => {
    await page.goto('/projects');
    
    // Click first project
    await page.click('.project-card >> nth=0');
    
    // Click edit
    await page.click('button:has-text("編輯"), button:has-text("Edit")');
    
    // Modify and save
    await page.fill('input[name="name"], input[placeholder*="名稱"]', 'Updated Project');
    await page.click('button[type="submit"]');
    
    // Verify updated
    await expect(page.locator('text=Updated Project')).toBeVisible();
  });
});

test.describe('Material Calculator', () => {
  test('should calculate material quantities', async ({ page }) => {
    await page.goto('/materials-calc');
    
    // Wait for page load
    await expect(page.locator('h1')).toBeVisible();
    
    // Fill in dimensions
    await page.fill('input[name="length"], input[placeholder*="長"]', '10');
    await page.fill('input[name="width"], input[placeholder*="寬"]', '5');
    
    // Check results appear
    await expect(page.locator('[class*="result"]')).toBeVisible();
  });

  test('should export calculation to PDF', async ({ page }) => {
    await page.goto('/materials-calc');
    
    // Fill in data
    await page.fill('input[name="length"]', '10');
    await page.fill('input[name="width"]', '5');
    
    // Click export
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("匯出"), button:has-text("Export")')
    ]);
    
    // Verify download
    expect(download.suggestedFilename()).toContain('.pdf');
  });
});

test.describe('Responsive Design', () => {
  test('should display correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Sidebar should be collapsed/hidden
    const sidebar = page.locator('[class*="sidebar"]');
    await expect(sidebar).toHaveCSS('transform', /translateX/);
    
    // Mobile menu button should be visible
    await expect(page.locator('button[class*="menu"]')).toBeVisible();
  });

  test('should display correctly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    // Content should adapt
    await expect(page.locator('#root')).toBeVisible();
  });
});
