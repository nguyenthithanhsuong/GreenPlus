/** Provider-neutral, server-only storage catalog resolution. No network or secrets. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KEY = /^[a-zA-Z0-9_-]{1,80}$/;
const IDENTIFIER = /^[a-z][a-z0-9_]{0,62}$/;
const TIERS = new Set(["regular", "pro", "enterprise"]);
const PROVIDERS = new Set(["supabase-postgres", "docker-postgres", "external-postgres"]);

export class TenantRoutingError extends Error {
  constructor(message) {
    super(message);
    this.name = "TenantRoutingError";
  }
}

export function validateStorageRecord(storeId, record) {
  if (typeof storeId !== "string" || !UUID.test(storeId))
    throw new TenantRoutingError("Invalid authenticated store ID");
  if (!record || typeof record !== "object" || Array.isArray(record))
    throw new TenantRoutingError("Tenant storage record is missing");
  if (record.store_id !== storeId)
    throw new TenantRoutingError("Tenant storage ownership mismatch");
  if (!TIERS.has(record.storage_tier) || !PROVIDERS.has(record.storage_provider))
    throw new TenantRoutingError("Unsupported tenant storage provider or tier");
  if (typeof record.storage_key !== "string" || !KEY.test(record.storage_key))
    throw new TenantRoutingError("Invalid tenant storage key");
  if (record.provisioning_state !== "ready")
    throw new TenantRoutingError("Tenant storage is not ready");
  return Object.freeze({
    storeId,
    tier: record.storage_tier,
    provider: record.storage_provider,
    storageKey: record.storage_key,
  });
}

/**
 * Targets are a trusted SERVER configuration, never request-controlled.
 * Each target must explicitly declare tier, databaseKey, schema, kind and URL.
 * Schema/database names are never interpolated from a tenant registry row.
 */
export function resolveTenantDataRoute({ storeId, record, targets }) {
  const tenant = validateStorageRecord(storeId, record);
  if (!targets || typeof targets !== "object" || Array.isArray(targets))
    throw new TenantRoutingError("Tenant storage targets are not configured");
  const target = Object.hasOwn(targets, `${tenant.provider}:${tenant.storageKey}`)
    ? targets[`${tenant.provider}:${tenant.storageKey}`]
    : null;
  if (!target || typeof target !== "object" || target.tier !== tenant.tier)
    throw new TenantRoutingError("Tenant storage target is not provisioned");
  if (!IDENTIFIER.test(target.schema) || !KEY.test(target.databaseKey ?? ""))
    throw new TenantRoutingError("Invalid configured storage target");
  if (tenant.tier === "pro" ? target.schema === "public" : target.schema !== "public")
    throw new TenantRoutingError("Configured target does not match tenant isolation tier");
  if (target.kind !== (tenant.provider === "supabase-postgres" ? "supabase" : "postgrest"))
    throw new TenantRoutingError("Configured storage transport does not match provider");
  let endpoint;
  try {
    endpoint = new URL(target.url);
  } catch {
    throw new TenantRoutingError("Invalid configured storage endpoint");
  }
  if (endpoint.username || endpoint.password || endpoint.search || endpoint.hash ||
      !["http:", "https:"].includes(endpoint.protocol))
    throw new TenantRoutingError("Unsafe configured storage endpoint");
  if (tenant.provider === "supabase-postgres" && endpoint.protocol !== "https:" &&
      !["localhost", "127.0.0.1"].includes(endpoint.hostname))
    throw new TenantRoutingError("Hosted Supabase requires HTTPS");
  if (tenant.provider === "docker-postgres" && endpoint.protocol === "http:" &&
      !/^(localhost|127\.0\.0\.1|[a-z0-9-]+)$/i.test(endpoint.hostname))
    throw new TenantRoutingError("Insecure remote Docker endpoint");
  return Object.freeze({
    ...tenant,
    kind: target.kind,
    schema: target.schema,
    databaseKey: target.databaseKey,
    url: endpoint.toString(),
  });
}
