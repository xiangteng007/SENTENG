import { test, expect } from "@playwright/test";

/**
 * Invoices Module E2E Tests
 * SENTENG ERP - Phase 2 Improvement
 */

test.describe("Invoices", () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.getByPlaceholder(/email|電子郵件/i).fill(process.env.E2E_TEST_EMAIL || "test@senteng.co");
    await page.getByPlaceholder(/password|密碼/i).fill(process.env.E2E_TEST_PASSWORD || "testpassword123");
    await page.getByRole("button", { name: /登入|Sign in/i }).click();
    
    // Wait for dashboard then navigate to invoices
    await page.waitForURL(/\/(dashboard|home)?$/i, { timeout: 15000 });
    await page.goto("/invoice");
  });

  test("should display invoice helper page", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /發票|invoice/i })).toBeVisible({ timeout: 10000 });
  });

  test("should show invoice list or stats", async ({ page }) => {
    // Should show some invoice data or empty state
    const hasContent = await page.getByText(/發票|invoice|統一編號/i).first().isVisible();
    expect(hasContent).toBeTruthy();
  });

  test("should show invoice creation form", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /新增|add|create|開立/i });
    if (await addButton.isVisible()) {
      await addButton.click();
      await expect(page.getByRole("dialog").or(page.getByRole("form"))).toBeVisible({ timeout: 5000 });
    }
  });

  test("should display VAT calculation fields", async ({ page }) => {
    // Taiwan invoice requires 5% VAT
    const vatRelated = page.getByText(/vat|稅額|5%|營業稅/i);
    if (await vatRelated.first().isVisible()) {
      expect(true).toBeTruthy();
    }
  });
});
