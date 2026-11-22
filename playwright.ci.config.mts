/** Single-workspace browser E2E: reuse build already produced by CI matrix. */
import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';
const app=process.env.GREENPLUS_E2E_APP;
if(!['admin','client','shipper'].includes(app??''))throw new Error('Set GREENPLUS_E2E_APP to admin, client or shipper');
const port={admin:3000,client:3001,shipper:3002}[app as 'admin'|'client'|'shipper'];
const baseURL=`http://127.0.0.1:${port}`;
export default defineConfig({
 testDir:'./tests/e2e',
 fullyParallel:false,workers:1,
 retries:process.env.CI?1:0,
 timeout:45000,
 outputDir:resolve('artifacts/playwright',app!,'test-results'),
 reporter:[['list'],['html',{open:'never',outputFolder:resolve('artifacts/playwright',app!,'report')}]],
 use:{baseURL,trace:'retain-on-failure',screenshot:'only-on-failure',actionTimeout:15000},
 webServer:{command:`npm run start -w web-${app}`,url:`${baseURL}/api/health`,reuseExistingServer:!process.env.CI,timeout:90000,env:{NEXT_TELEMETRY_DISABLED:'1'}},
});
