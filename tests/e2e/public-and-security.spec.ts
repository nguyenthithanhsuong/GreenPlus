import {test,expect} from '@playwright/test';
const app=process.env.GREENPLUS_E2E_APP;
// Read-only guest routes; never place orders, create users, or mutate production data.
test('public health has valid shape and does not publish secrets',async({request})=>{
 const res=await request.get('/api/health');
 expect(res.status()).toBe(200);
 const data=await res.json();
 expect(data.status).toBe('ok');expect(data.service).toBe(`web-${app}`);
 const serialized=JSON.stringify(data);
 for(const forbidden of ['service_role','AI_LLM_KEY','SUPABASE_SERVICE_ROLE_KEY','DATABASE_URL'])expect(serialized).not.toContain(forbidden);
});
for(const viewport of [{width:390,height:844},{width:1366,height:768}]){
 test(`login is usable at ${viewport.width}px`,async({page})=>{
  await page.setViewportSize(viewport);
  const response=await page.goto('/login',{waitUntil:'domcontentloaded'});
  expect(response?.status()).toBe(200);
  await expect(page.locator('input[type=password]').first()).toBeVisible();
  await expect(page.locator('input[type=email]').first()).toBeVisible();
  const width=await page.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:window.innerWidth}));
  // 2px fractional pixel tolerance; do not hide genuine horizontal overflow.
  expect(width.document).toBeLessThanOrEqual(width.viewport+2);
 });
}
test('session boundary rejects anonymous requests',async({request})=>{
 const path=app==='shipper'?'/api/shipper/deliveries':app==='admin'?'/api/users':'/api/orders';
 const res=await request.get(path,{maxRedirects:0});
 expect([401,403]).toContain(res.status());
});
test('authenticated page content is not publicly cacheable',async({request})=>{
 if(app!=='shipper')test.skip();
 const res=await request.get('/profile',{maxRedirects:0});
 expect([307,308]).toContain(res.status());
 expect(new URL(res.headers()['location'],'http://127.0.0.1').pathname).toBe('/login');
});

test('mobile installations expose an installable PWA manifest and local icons',async({request})=>{
 if(app==='admin')test.skip();
 const response=await request.get('/manifest.webmanifest');
 expect(response.status()).toBe(200);
 const manifest=await response.json();
 expect(manifest.display).toBe('standalone');
 expect(manifest.start_url).toBe('/');
 expect(Array.isArray(manifest.icons)).toBe(true);
 for(const icon of manifest.icons){
  expect(icon.src.startsWith('/')).toBe(true);
  const file=await request.get(icon.src);
  expect(file.status()).toBe(200);
 }
});


test('unauthenticated user cannot read human support inquiries',async({request})=>{
 const response=await request.get('/api/support/inquiries',{maxRedirects:0});
 expect([401,403]).toContain(response.status());
});
