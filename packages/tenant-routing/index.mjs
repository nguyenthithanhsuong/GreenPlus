// Provider independent routing contract. Never take schema or database addresses from the browser.
export const TIERS = Object.freeze(["regular", "pro", "enterprise"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const SLOTS = Object.freeze({
  regular: ["shared"],
  pro: ["pro_a", "pro_b"],
  enterprise: ["enterprise_a", "enterprise_b"],
});

export function validateTenant(tenant) {
  if (!tenant || typeof tenant !== "object") throw new Error("Missing tenant record");
  if (!TIERS.includes(tenant.tier)) throw new Error("Unknown tenant tier");
  if (!SLOTS[tenant.tier].includes(tenant.slot)) throw new Error("Untrusted storage slot");
  if (typeof tenant.store_id !== "string" || !UUID.test(tenant.store_id))
    throw new Error("Invalid tenant identifier");
  return tenant;
}

export function storageForTenant(tenant) {
  const record = validateTenant(tenant);
  if (record.tier === "regular") return { provider: "postgres", database: "shared", schema: "public", rowScoped: true };
  if (record.tier === "pro") return { provider: "postgres", database: "shared", schema: record.slot, rowScoped: false };
  return { provider: "postgres", database: record.slot, schema: "public", rowScoped: false };
}
