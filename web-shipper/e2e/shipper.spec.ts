import { test, expect } from "@playwright/test";

test("login uses the GreenPlus brand and stable form layout", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Đăng nhập" })).toBeVisible();
  await expect(page.getByLabel("Email tài khoản")).toBeVisible();
  await expect(page.getByLabel("Mật khẩu", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Đăng nhập" })).toBeVisible();
  const form = page.locator("form");
  const originalBounds = await form.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return { left: rect.left, width: rect.width };
  });
  // Exercise UI error handling deterministically. Authentication/API behavior is
  // tested separately; an unavailable Web Admin must not make a UI layout test flaky.
  await page.route("**/api/auth/sign-in", async (route) => {
    expect(route.request().method()).toBe("POST");
    const credentials = route.request().postDataJSON();
    expect(credentials).toEqual({
      email: "invalid@example.com",
      password: "bad-credentials",
    });
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ error: "Email hoặc mật khẩu không đúng" }),
    });
  });
  await page.getByLabel("Email tài khoản").fill("invalid@example.com");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("bad-credentials");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page.getByRole("alert")).toContainText("Email hoặc mật khẩu không đúng");
  // An inline error naturally increases the form's height. The important
  // stability contract is that the form does not jump horizontally or resize.
  const errorBounds = await form.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return { left: rect.left, width: rect.width };
  });
  expect(Math.abs(errorBounds.left - originalBounds.left)).toBeLessThanOrEqual(2);
  expect(Math.abs(errorBounds.width - originalBounds.width)).toBeLessThanOrEqual(2);
});

test("shipper API never returns orders to guests", async ({ request }) => {
  const response = await request.get("/api/shipper/deliveries");
  expect(response.status()).toBe(401);
});

test("sign-in rejects invalid fields without creating a session", async ({
  request,
}) => {
  const response = await request.post("/api/auth/sign-in", {
    data: { email: "", password: "" },
  });
  expect(response.status()).toBe(400);
  expect(response.headers()["set-cookie"] ?? "").not.toContain(
    "gp_shipper_session=",
  );
});
