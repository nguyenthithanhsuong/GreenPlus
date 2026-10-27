import { test, expect } from '@playwright/test';

test('login uses the GreenPlus brand and stable form layout', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible();
  await expect(page.getByLabel('Email tài khoản')).toBeVisible();
  await expect(page.getByLabel('Mật khẩu')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Đăng nhập' })).toBeVisible();
  const form = page.locator('form');
  const originalHeight = await form.evaluate((el) => el.getBoundingClientRect().height);
  await page.getByLabel('Email tài khoản').fill('invalid@example.com');
  await page.getByLabel('Mật khẩu').fill('bad-credentials');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  const errorHeight = await form.evaluate((el) => el.getBoundingClientRect().height);
  expect(Math.abs(errorHeight - originalHeight)).toBeLessThanOrEqual(2);
});

test('shipper API never returns orders to guests', async ({ request }) => {
  const response = await request.get('/api/shipper/deliveries');
  expect(response.status()).toBe(401);
});

test('sign-in rejects invalid fields without creating a session', async ({ request }) => {
  const response = await request.post('/api/auth/sign-in', { data: { email: '', password: '' } });
  expect(response.status()).toBe(400);
  expect(response.headers()['set-cookie'] ?? '').not.toContain('gp_shipper_session=');
});
