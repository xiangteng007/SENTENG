import { test, expect } from "@playwright/test";

/**
 * Authentication E2E Tests
 * SENTENG ERP - Phase 2 Improvement
 */
test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("should display login page", async ({ page }) => {
    await expect(page.locator("h1, h2").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /登入|Sign in/i })).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.getByPlaceholder(/email|電子郵件/i).fill("invalid@test.com");
    await page.getByPlaceholder(/password|密碼/i).fill("wrongpassword");
    await page.getByRole("button", { name: /登入|Sign in/i }).click();

    // Wait for error message
    await expect(page.getByText(/錯誤|error|invalid/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("should redirect to dashboard after successful login", async ({ page }) => {
    // Use test credentials (ensure these exist in test environment)
    await page.getByPlaceholder(/email|電子郵件/i).fill(process.env.E2E_TEST_EMAIL || "test@senteng.co");
    await page.getByPlaceholder(/password|密碼/i).fill(process.env.E2E_TEST_PASSWORD || "testpassword123");
    await page.getByRole("button", { name: /登入|Sign in/i }).click();

    // Should redirect to dashboard or home
    await expect(page).toHaveURL(/\/(dashboard|home)?$/i, { timeout: 15000 });
  });

  test("should be able to toggle password visibility", async ({ page }) => {
    const passwordInput = page.getByPlaceholder(/password|密碼/i);
    await passwordInput.fill("testpassword");

    // Find toggle button if exists
    const toggleButton = page.getByRole("button", { name: /顯示|show|hide/i });
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute("type", "text");
    }
  });
});

test.describe("Protected Routes", () => {
  test("should redirect to login when accessing protected page without auth", async ({ page }) => {
    await page.goto("/projects");
    await expect(page).toHaveURL(/\/login/i, { timeout: 10000 });
  });
});
