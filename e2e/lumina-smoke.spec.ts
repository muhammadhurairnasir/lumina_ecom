import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const API = process.env.PLAYWRIGHT_API_URL || 'http://localhost:5000/api/v1';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@lumina.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';

/** API sets cookies on :5000; Next middleware reads adminToken on :3000 (via setAuth). */
async function loginAsAdmin(page: import('@playwright/test').Page) {
  const loginRes = await page.request.post(`${API}/auth/admin-login`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  expect(loginRes.ok()).toBeTruthy();
  const { data } = await loginRes.json();
  const token = data.accessToken as string;
  await page.context().addCookies([
    {
      name: 'adminToken',
      value: token,
      url: BASE,
      httpOnly: true,
      sameSite: 'Strict',
    },
  ]);
}

test.describe('Lumina visual smoke tests', () => {
  test('storefront homepage loads', async ({ page }) => {
    await page.goto(BASE);
    await expect(page).toHaveTitle(/Lumina|LUMINA|Shop/i);
    await expect(page.getByRole('link', { name: /products/i }).first()).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: 'e2e/screenshots/01-homepage.png', fullPage: true });
  });

  test('admin login page renders', async ({ page }) => {
    await page.goto(`${BASE}/admin/login`);
    await expect(page.getByRole('heading', { name: /sign in to admin/i })).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/02-admin-login.png', fullPage: true });
  });

  test('admin login → dashboard', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE}/admin`);
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: 'e2e/screenshots/03-admin-dashboard.png', fullPage: true });
  });

  test('admin products list', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE}/admin/products`);
    await expect(page.getByRole('heading', { name: /^products$/i })).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: 'e2e/screenshots/04-admin-products.png', fullPage: true });
  });

  test('chatbot widget opens', async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole('button', { name: /open shopping assistant/i }).click();
    await expect(page.getByText(/how can i help today/i)).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'e2e/screenshots/05-chatbot.png', fullPage: true });
  });
});
