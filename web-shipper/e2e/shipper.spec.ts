import { test, expect } from "@playwright/test";

test("login uses the GreenPlus brand and stable form layout", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  // This case verifies React's error rendering, not the API transport. Inject
  // a complete in-browser Response before Next.js executes; the real API
  // remains covered by the independent request tests below.
  await page.addInitScript(() => {
    type LoginCall = { method: string; credentials: unknown };
    const state = (window as Window & {
      __greenplusLoginFixture?: { calls: LoginCall[]; returnedStatus: number };
    });
    state.__greenplusLoginFixture = { calls: [], returnedStatus: 0 };
    const nativeFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = new Request(input, init);
      const expected = new URL("/api/auth/sign-in", window.location.origin);
      if (request.url === expected.href && request.method === "POST") {
        state.__greenplusLoginFixture!.calls.push({
          method: request.method,
          credentials: await request.clone().json(),
        });
        state.__greenplusLoginFixture!.returnedStatus = 401;
        return new Response(
          JSON.stringify({ error: "Email hoặc mật khẩu không đúng" }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }
      return nativeFetch(input, init);
    };
  });
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Đăng nhập" })).toBeVisible();
  await expect(page.getByLabel("Email tài khoản")).toBeVisible();
  await expect(page.getByLabel("Mật khẩu", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Đăng nhập" })).toBeVisible();
  // Even a production build can paint SSR HTML before event handlers attach.
  // Retry a harmless, observable React state transition instead of trusting
  // the first click or waiting a fixed amount of time.
  await expect(async () => {
    await page.getByRole("button", { name: "Hiện mật khẩu" }).click();
    await expect(page.getByRole("button", { name: "Ẩn mật khẩu" })).toBeVisible({ timeout: 1200 });
    await expect(page.getByLabel("Mật khẩu", { exact: true })).toHaveAttribute("type", "text");
  }).toPass({ timeout: 20000, intervals: [250, 500, 1000] });
  await page.getByRole("button", { name: "Ẩn mật khẩu" }).click();
  await expect(page.getByLabel("Mật khẩu", { exact: true })).toHaveAttribute(
    "type", "password",
  );
  const form = page.locator("form");
  const originalBounds = await form.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return { left: rect.left, width: rect.width };
  });
  // The test fixture replaces only the login fetch. Check its exact payload
  // as well as the user-facing error. No network 401 is claimed by this test.
  await page.getByLabel("Email tài khoản").fill("invalid@example.com");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("bad-credentials");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect.poll(async () => page.evaluate(() =>
    (window as Window & { __greenplusLoginFixture?: { calls: unknown[] } })
      .__greenplusLoginFixture?.calls.length ?? 0,
  )).toBe(1);
  const fixture = await page.evaluate(() =>
    (window as Window & {
      __greenplusLoginFixture?: {
        calls: { method: string; credentials: unknown }[];
        returnedStatus: number;
      };
    }).__greenplusLoginFixture,
  );
  expect(fixture).toEqual({
    calls: [{
      method: "POST",
      credentials: { email: "invalid@example.com", password: "bad-credentials" },
    }],
    returnedStatus: 401,
  });
  try {
    await expect(page.getByRole("alert")).toContainText(
      "Email hoặc mật khẩu không đúng",
    );
  } catch (error) {
    // Capture enough evidence to distinguish a React runtime error, navigation,
    // or a pending submit if a real GitHub runner still reproduces the issue.
    const uiState = await page.evaluate(() => ({
      href: window.location.href,
      alerts: [...document.querySelectorAll('[role="alert"]')]
        .map((element) => element.textContent?.trim()),
      submitText: document.querySelector('button[type="submit"]')?.textContent?.trim(),
      submitDisabled: (document.querySelector('button[type="submit"]') as HTMLButtonElement | null)?.disabled,
      fixture: (window as Window & { __greenplusLoginFixture?: unknown }).__greenplusLoginFixture,
    }));
    await test.info().attach("shipper-login-ui-state.json", {
      body: JSON.stringify({ uiState, browserErrors }, null, 2),
      contentType: "application/json",
    });
    throw error;
  }
  await expect(page.getByRole("button", { name: "Đăng nhập" })).toBeEnabled();
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
