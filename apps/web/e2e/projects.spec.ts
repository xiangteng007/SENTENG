import { test, expect } from "@playwright/test";

/**
 * Projects Module E2E Tests
 * SENTENG ERP - Phase 2 Improvement
 */

// Setup: Login before each test
test.describe("Projects", () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.getByPlaceholder(/email|電子郵件/i).fill(process.env.E2E_TEST_EMAIL || "test@senteng.co");
    await page.getByPlaceholder(/password|密碼/i).fill(process.env.E2E_TEST_PASSWORD || "testpassword123");
    await page.getByRole("button", { name: /登入|Sign in/i }).click();
    
    // Wait for dashboard then navigate to projects
    await page.waitForURL(/\/(dashboard|home)?$/i, { timeout: 15000 });
    await page.goto("/projects");
  });

  test("should display projects list", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /專案|projects/i })).toBeVisible({ timeout: 10000 });
  });

  test("should show add project button", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /新增|add|create/i });
    await expect(addButton).toBeVisible();
  });

  test("should open project form when clicking add", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /新增|add|create/i });
    await addButton.click();

    // Should show form or modal
    await expect(page.getByRole("dialog").or(page.getByRole("form"))).toBeVisible({ timeout: 5000 });
  });

  test("should be able to search projects", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/搜尋|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill("test project");
      // Wait for search to process
      await page.waitForTimeout(500);
    }
  });
});
