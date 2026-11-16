import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const policy = await import("../web-admin/src/lib/portal-access.ts");
const text = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("platform admin has governance, never daily commerce routes", () => {
  for (const path of ["/dashboard", "/audit", "/users", "/roles", "/system", "/greencreators"])
    assert.equal(policy.canAccessPage("admin", path), true, path);
  for (const path of ["/inventories", "/prices", "/orders", "/complaints", "/ai/alerts", "/ai/promotions"])
    assert.equal(policy.canAccessPage("admin", path), false, path);
  for (const api of ["/api/orders", "/api/ai/promotions", "/api/complaints"])
    assert.equal(policy.canAccessApi("admin", api, "GET"), false, api);
});

test("manager can audit own store; employee cannot read audit", () => {
  assert.equal(policy.canAccessPage("manager", "/audit"), true);
  assert.equal(policy.canAccessApi("manager", "/api/audit", "GET"), true);
  assert.equal(policy.canAccessApi("manager", "/api/audit", "POST"), false);
  assert.equal(policy.canAccessPage("employee", "/audit"), false);
  assert.equal(policy.canAccessApi("employee", "/api/audit", "GET"), false);
  assert.equal(policy.canAccessApi("manager", "/api/ai/health", "GET"), false);
});

test("RBAC migration is additive and audit queries are server-only", () => {
  const migration = text("supabase/migrations/0019_rbac_audit_foundation.sql");
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.permissions/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.role_permissions/);
  assert.match(migration, /REVOKE ALL ON TABLE public\.permissions,public\.role_permissions,public\.audit_logs/);
  assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN/);
  const audit = text("web-admin/src/app/api/audit/route.ts");
  assert.match(audit, /hasPermissionForUser/);
  assert.match(audit, /managerStoreIds/);
  assert.match(audit, /redact\(row\.before_data\)/);
});
