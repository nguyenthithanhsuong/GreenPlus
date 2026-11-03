import test from "node:test";
import assert from "node:assert/strict";
import { storageForTenant, validateTenant, TIERS } from "../packages/tenant-routing/index.mjs";
const ID = "00000000-0000-4000-8000-000000000001";
const tenant = (tier, slot) => ({ store_id: ID, name: "Example", tier, slot });
test("all three tiers are represented", () => assert.deepEqual(TIERS, ["regular", "pro", "enterprise"]));
test("regular routes to shared rows", () => assert.deepEqual(storageForTenant(tenant("regular", "shared")), { provider: "postgres", database: "shared", schema: "public", rowScoped: true }));
test("pro routes to a known schema", () => assert.deepEqual(storageForTenant(tenant("pro", "pro_a")), { provider: "postgres", database: "shared", schema: "pro_a", rowScoped: false }));
test("enterprise routes to a dedicated database", () => assert.deepEqual(storageForTenant(tenant("enterprise", "enterprise_b")), { provider: "postgres", database: "enterprise_b", schema: "public", rowScoped: false }));
test("rejects arbitrary schema names", () => assert.throws(() => validateTenant(tenant("pro", "public;drop table stores")), /Untrusted storage slot/));
test("rejects arbitrary database names", () => assert.throws(() => storageForTenant(tenant("enterprise", "production")), /Untrusted storage slot/));
test("rejects invalid tenant ids", () => assert.throws(() => validateTenant({ ...tenant("regular", "shared"), store_id: "../../" }), /Invalid tenant/));

test("rejects malformed UUIDs with the correct length", () => assert.throws(() => validateTenant({ ...tenant("regular", "shared"), store_id: "------------------------------------" }), /Invalid tenant/));
