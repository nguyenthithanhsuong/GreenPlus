import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path) => readFileSync(join(root, path), "utf8");

test("every private Shipper page requires server-auth before rendering", () => {
  for (const route of ["", "profile/", "scan/", "support/", "ai/chat/"]) {
    const path = `web-shipper/src/app/${route}page.tsx`;
    const source = read(path);
    assert.match(source, /await requireShipperPage\(\)/, path);
    assert.match(source, /export const dynamic = ["']force-dynamic["']/, path);
    assert.ok(source.indexOf("await requireShipperPage()") < source.indexOf("return <"), path);
  }
  const gate = read("web-shipper/src/server/require-page-session.ts");
  assert.match(gate, /await requireShipper\(\)/);
  assert.match(gate, /error\.status === 401 \|\| error\.status === 403/);
  assert.doesNotMatch(read("web-shipper/src/app/login/page.tsx"), /requireShipperPage/);
  assert.doesNotMatch(read("web-shipper/src/app/install/page.tsx"), /requireShipperPage/);
});

test("Admin login and logout share a real HttpOnly server cookie lifecycle", () => {
  const signIn = read("web-admin/src/app/api/auth/sign-in/route.ts");
  const signOut = read("web-admin/src/app/api/auth/sign-out/route.ts");
  const nav = read("web-admin/frontend/settings/SettingsNav.tsx");
  const session = read("web-admin/src/app/api/auth/session/route.ts");
  assert.match(signIn, /maxAge: 60 \* 60 \* 8/);
  assert.match(signOut, /cookies\.set\("gp_admin_auth", ""/);
  assert.match(signOut, /maxAge: 0/);
  assert.match(nav, /fetch\("\/api\/auth\/sign-out"/);
  assert.doesNotMatch(nav, /\/api\/auth\/sync\?portal=1/);
  assert.match(session, /verifySession\(token\)/);
  assert.match(session, /\.eq\("user_id", identity\.id\)/);
  assert.match(session, /data\.status !== "active"/);
  assert.match(session, /currentRole !== asPortalRole\(identity\.role\)/);
  assert.match(session, /private, no-store/);
});

test("Admin shell is hidden until live session verification and role policy", async () => {
  const guard = read("web-admin/frontend/shared/PageGuard.tsx");
  const shell = read("web-admin/frontend/shared/AdminShell.tsx");
  const login = read("web-admin/src/components/auth/auth-screen.tsx");
  assert.match(guard, /fetch\("\/api\/auth\/session"/);
  assert.match(guard, /clearAuth\(\)/);
  assert.match(guard, /canAccessPage\(role, pathname\)/);
  assert.ok(shell.indexOf("<PageGuard>") < shell.indexOf("<AdminSidebar"));
  assert.match(login, /fetch\("\/api\/auth\/session"/);
  const { canAccessPage } = await import("../web-admin/src/lib/portal-access.ts");
  assert.equal(canAccessPage("admin", "/system"), true);
  assert.equal(canAccessPage("manager", "/system"), false);
  assert.equal(canAccessPage("employee", "/system"), false);
  assert.match(read("web-admin/frontend/shared/AdminSidebar.tsx"), /label: "Hệ thống"/);
  assert.ok(existsSync(join(root, "web-admin/src/app/system/page.tsx")));
});

test("Customer account and order layouts enforce signed cookie before private pages", () => {
  const guard = read("web-client/backend/core/require-customer-page.ts");
  assert.match(guard, /requireCustomerIdentity\(request\)/);
  assert.match(guard, /data\.status !== "active"/);
  assert.match(guard, /roleName\?\.toLowerCase\(\) !== "customer"/);
  assert.match(guard, /redirect\("\/login"\)/);
  for (const section of ["orders", "profile", "subscriptions", "complaints", "support", "group-purchase", "green-upload"]) {
    const layout = read(`web-client/src/app/${section}/layout.tsx`);
    assert.match(layout, /await requireCustomerPage\(\)/, section);
    assert.match(layout, /force-dynamic/, section);
  }
  assert.match(read("web-client/src/app/ai/recipes/layout.tsx"), /await requireCustomerPage\(\)/);
  const logout = read("web-client/src/lib/sign-out-customer.ts");
  assert.match(logout, /fetch\("\/api\/auth\/sync"/);
  assert.match(read("web-client/frontend/profile/components/ProfileMenuPage.tsx"), /await signOutCustomerSession\(\)/);
  assert.match(read("web-client/frontend/profile/components/ProfileMine.tsx"), /await signOutCustomerSession\(\)/);
  assert.match(read("web-client/src/app/profile/lock-account/page.tsx"), /await signOutCustomerSession\(\)/);
});
