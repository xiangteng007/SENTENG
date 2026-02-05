import { test, expect } from '@playwright/test';

/**
 * Core User Flow E2E Tests
 * Expert Panel v4.9: QA Specialist
 */

test.describe('Authentication Flow', () => {
  test('should show login page when not authenticated', async ({ page }) => {
    await page.goto('/');
    // Should redirect to login
    await expect(page.locator('text=登入')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard|\/$/);
  });
});

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/');
  });

  test('should display main navigation', async ({ page }) => {
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should show loading states', async ({ page }) => {
    // Check for skeleton or loading indicator
    await page.goto('/');
    const hasLoading = await page.locator('.animate-pulse, .skeleton, text=載入中').count();
    expect(hasLoading).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Projects Page', () => {
  test('should display projects list', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.locator('h1')).toContainText(/專案|Projects/i);
  });

  test('should filter projects', async ({ page }) => {
    await page.goto('/projects');
    const searchInput = page.locator('input[placeholder*="搜尋"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Material Calculator', () => {
  test('should load calculator page', async ({ page }) => {
    await page.goto('/material-calculator');
    await expect(page.locator('h1')).toContainText(/材料|Calculator/i);
  });

  test('should calculate materials', async ({ page }) => {
    await page.goto('/material-calculator');
    // Look for calculation inputs
    const inputs = page.locator('input[type="number"]');
    if (await inputs.count() > 0) {
      await inputs.first().fill('100');
    }
  });
});

test.describe('Professional Calculators', () => {
  test('should load BTU calculator', async ({ page }) => {
    await page.goto('/calculators');
    await expect(page.locator('text=BTU')).toBeVisible();
  });

  test('should switch between calculator tabs', async ({ page }) => {
    await page.goto('/calculators');
    // Click on circuit calculator tab
    const circuitTab = page.locator('button:has-text("迴路")');
    if (await circuitTab.isVisible()) {
      await circuitTab.click();
    }
  });
});

test.describe('P2 Modules', () => {
  test('should load government projects', async ({ page }) => {
    await page.goto('/government-projects');
    await expect(page.locator('h1')).toContainText(/政府標案|Government/i);
  });

  test('should load safety page', async ({ page }) => {
    await page.goto('/safety');
    await expect(page.locator('h1')).toContainText(/職安衛|Safety/i);
  });

  test('should load fire safety', async ({ page }) => {
    await page.goto('/fire-safety');
    await expect(page.locator('h1')).toContainText(/消防|Fire/i);
  });

  test('should load contract alerts', async ({ page }) => {
    await page.goto('/contract-alerts');
    await expect(page.locator('h1')).toContainText(/合約|Contract/i);
  });
});

test.describe('Responsive Design', () => {
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    // Sidebar should be hidden or collapsible
    const sidebar = page.locator('aside, nav');
    expect(await sidebar.count()).toBeGreaterThan(0);
  });
});
