import { test, expect } from "@playwright/test";

test("unauthenticated shipper is directed to branded login", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /GreenPlus/ })).toBeVisible();
  await expect(page.getByLabel("Email tài khoản Shipper")).toBeVisible();
  await expect(page.getByLabel("Mật khẩu")).toBeVisible();
  await expect(page.getByRole("button", { name: "Đăng nhập" })).toBeVisible();
});

test("shipper API never returns another user orders to guests", async ({
  request,
}) => {
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
