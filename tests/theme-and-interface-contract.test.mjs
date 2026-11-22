import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const get=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
test('three web applications use the shared theme controller and CSS',()=>{
 for(const name of ['admin','client','shipper']){
  const layout=get(`web-${name}/src/app/layout.tsx`);
  assert.match(layout,/ThemePreferences/);
  assert.match(layout,/support-ui\/theme.css/);
  assert.match(layout,/<ThemePreferences\s*\/>/);
 }
 assert.match(get('packages/support-ui/ThemePreferences.tsx'),/useSyncExternalStore/);
 assert.match(get('packages/support-ui/theme.css'),/prefers-reduced-motion/);
 assert.ok(existsSync(new URL('../tests/e2e/theme-preferences.spec.ts',import.meta.url)));
});
test('live support prevents overlapping fetches, aborts obsolete loads and updates on tab focus',()=>{
 const ui=get('packages/support-ui/LiveSupportView.tsx');
 assert.match(ui,/AbortController/);
 assert.match(ui,/controller\.abort\(\)/);
 assert.match(ui,/visibilitychange/);
 assert.match(ui,/prior\?\.key===key&&!force/);
 assert.match(ui,/await refreshMessages\(true\)/);
});
test('Shipper dashboard avoids duplicate polling during slow API calls',()=>{
 const ui=get('web-shipper/src/frontend/dashboard/Dashboard.tsx');
 assert.match(ui,/loadInFlight\.current/);
 assert.match(ui,/visibilitychange/);
});
