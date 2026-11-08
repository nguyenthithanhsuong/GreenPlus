import { defineConfig } from "@playwright/test";
import { resolve } from "node:path";

// Playwright can transpile .ts configs to CommonJS on Node 22.
const workspace = __dirname;
const diagnostics = resolve(workspace, "../artifacts/playwright/web-shipper");

export default defineConfig({
  testDir: "./e2e",
  outputDir: resolve(diagnostics, "test-results"),
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never", outputFolder: resolve(diagnostics, "report") }]]
    : [["list"]],
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
