import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://127.0.0.1:3002",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    // CI tests a fully built application, not a partially compiled dev page.
    command: process.env.CI ? "npm run start" : "npm run dev",
    url: "http://127.0.0.1:3002/login",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
