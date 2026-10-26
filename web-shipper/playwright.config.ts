import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'./e2e',use:{baseURL:'http://127.0.0.1:3002'},webServer:{command:'npm run dev',url:'http://127.0.0.1:3002',reuseExistingServer:!process.env.CI,timeout:120000}});
