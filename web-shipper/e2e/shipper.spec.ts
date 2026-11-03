import { test, expect } from "@playwright/test";

test("login is accessible, responsive and validates fields in the browser", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");

  await expect(page.getByText("GreenPlus", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Đăng nhập" })).toBeVisible();

  const email = page.getByLabel("Email tài khoản");
  const password = page.getByLabel("Mật khẩu", { exact: true });
  const submit = page.getByRole("button", { name: "Đăng nhập" });
  const form = page.locator("form");

  await expect(email).toBeVisible();
  await expect(password).toBeVisible();
  await expect(submit).toBeVisible();
  await expect(email).toHaveAttribute("type", "email");
  await expect(email).toHaveAttribute("required", "");
  await expect(password).toHaveAttribute("required", "");
  await expect(password).toHaveAttribute("type", "password");

  const originalBounds = await form.evaluate((element) => {
    const { left, width } = element.getBoundingClientRect();
    return { left, width };
  });

  // Exercise a real client-side interaction. This proves that the page is
  // interactive without depending on a database or an intercepted 401 response.
  await expect(async () => {
    await page.getByRole("button", { name: "Hiện mật khẩu" }).click();
    await expect(page.getByRole("button", { name: "Ẩn mật khẩu" })).toBeVisible({ timeout: 1200 });
    await expect(password).toHaveAttribute("type", "text");
  }).toPass({ timeout: 20000, intervals: [250, 500, 1000] });
  await page.getByRole("button", { name: "Ẩn mật khẩu" }).click();
  await expect(password).toHaveAttribute("type", "password");

  // Validate actual HTML form constraints. Do not simulate a sign-in attempt:
  // its asynchronous error feedback depends on a live runtime we cannot seed
  // here. API authorization is checked separately below, with real requests.
  await email.fill("invalid-email");
  await password.fill("a-password");
  expect(await email.evaluate((input) => (input as HTMLInputElement).validity.typeMismatch)).toBe(true);
  expect(await form.evaluate((element) => (element as HTMLFormElement).checkValidity())).toBe(false);

  await email.fill("shipper@example.com");
  await password.fill("");
  expect(await form.evaluate((element) => (element as HTMLFormElement).checkValidity())).toBe(false);

  await password.fill("a-password");
  expect(await form.evaluate((element) => (element as HTMLFormElement).checkValidity())).toBe(true);

  const finalBounds = await form.evaluate((element) => {
    const { left, width } = element.getBoundingClientRect();
    return { left, width };
  });
  expect(Math.abs(finalBounds.left - originalBounds.left)).toBeLessThanOrEqual(2);
  expect(Math.abs(finalBounds.width - originalBounds.width)).toBeLessThanOrEqual(2);
  expect(finalBounds.width).toBeLessThanOrEqual(390);
});

test("shipper API never returns orders to guests", async ({ request }) => {
  const response = await request.get("/api/shipper/deliveries");
  expect(response.status()).toBe(401);
});

test("sign-in rejects invalid fields without creating a session", async ({ request }) => {
  const response = await request.post("/api/auth/sign-in", {
    data: { email: "", password: "" },
  });
  expect(response.status()).toBe(400);
  expect(response.headers()["set-cookie"] ?? "").not.toContain("gp_shipper_session=");
});
