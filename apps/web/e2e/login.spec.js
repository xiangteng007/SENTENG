import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test('should show login page when not authenticated', async ({ page }) => {
    await page.goto('/');

    // Should see the login page with Senteng branding
    await expect(page.locator('text=盛騰')).toBeVisible({ timeout: 10000 });
  });

  test('should have Google sign-in button', async ({ page }) => {
    await page.goto('/');

    // Should have a Google login button
    const googleBtn = page.locator('button:has-text("Google")');
    await expect(googleBtn).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Health Check', () => {
  test('should return healthy from API', async ({ request }) => {
    const baseUrl = process.env.VITE_API_URL || 'http://localhost:3000/api/v1';
    const response = await request.get(`${baseUrl}/health`);
    expect(response.status()).toBe(200);
  });
});
