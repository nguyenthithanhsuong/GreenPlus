import { activeTenantScope } from "./tenant-store";
import { createServiceRoleSupabaseClient } from "./supabase";
import { AppError } from "./errors";
import {
  resolveTenantDataRoute,
  TenantRoutingError,
  type StorageTarget,
} from "../../../packages/tenant-routing/registry.mjs";
import {
  createTenantPostgrestAdapter,
  type TenantPostgrestAdapter,
} from "../../../packages/tenant-routing/postgrest-adapter.mjs";

/** Default-off. This is a pilot for manager product reads, not a global cutover. */
export function tenantProductReadsEnabled(): boolean {
  return process.env.GREENPLUS_TENANT_DATA_READ_PRODUCTS === "true";
}

/** Separate staging flag; categories and their product counts must use the SAME tenant route. */
export function tenantCategoryReadsEnabled(): boolean {
  return process.env.GREENPLUS_TENANT_DATA_READ_CATEGORIES === "true";
}

function configuredTargets(): Record<string, StorageTarget> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl)
    throw new AppError("Tenant data provider is not configured", 503);
  const targets: Record<string, StorageTarget> = {
    "supabase-postgres:primary": {
      kind: "supabase",
      tier: "regular",
      databaseKey: "primary",
      schema: "public",
      url: new URL("/rest/v1/", supabaseUrl).toString(),
    },
  };
  const raw = process.env.GREENPLUS_TENANT_POSTGREST_TARGETS_JSON;
  if (!raw) return targets;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new AppError("Invalid tenant data target configuration", 503);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    throw new AppError("Invalid tenant data target configuration", 503);
  for (const [key, target] of Object.entries(parsed)) {
    // Never allow a JSON entry to replace the production Supabase mapping.
    if (
      !/^(docker-postgres|external-postgres):[a-zA-Z0-9_-]{1,80}$/.test(key) ||
      !target ||
      typeof target !== "object" ||
      Array.isArray(target)
    )
      throw new AppError("Invalid tenant data target configuration", 503);
    const value = target as Record<string, unknown>;
    if (
      !["regular", "pro", "enterprise"].includes(String(value.tier)) ||
      value.kind !== "postgrest" ||
      typeof value.url !== "string" ||
      typeof value.schema !== "string" ||
      typeof value.databaseKey !== "string"
    )
      throw new AppError("Invalid tenant data target configuration", 503);
    targets[key] = value as unknown as StorageTarget;
  }
  return targets;
}

/**
 * Must be called inside withSentry's authenticated AsyncLocalStorage scope.
 * Missing registry/target/credentials are errors, NEVER a Supabase fallback.
 */
export async function tenantDataForActiveStore(): Promise<TenantPostgrestAdapter> {
  const scope = activeTenantScope();
  if (!scope || scope.storeIds.length !== 1)
    throw new AppError("A single authorized store is required", 403);
  const storeId = scope.storeIds[0];
  const db = createServiceRoleSupabaseClient();
  const { data, error } = await db
    .from("tenant_storage_registry")
    .select(
      "store_id,storage_tier,storage_provider,storage_key,provisioning_state",
    )
    .eq("store_id", storeId)
    .maybeSingle();
  if (error) throw new AppError("Tenant storage registry is unavailable", 503);
  let route;
  try {
    route = resolveTenantDataRoute({
      storeId,
      record: data,
      targets: configuredTargets(),
    });
  } catch (cause) {
    if (cause instanceof TenantRoutingError)
      throw new AppError("Store data is not available for this tenant", 503);
    throw cause;
  }
  const token =
    route.kind === "supabase"
      ? process.env.SUPABASE_SERVICE_ROLE_KEY
      : process.env.GREENPLUS_TENANT_POSTGREST_BEARER;
  if (!token)
    throw new AppError("Tenant data credentials are not configured", 503);
  return createTenantPostgrestAdapter({
    route,
    headers:
      route.kind === "supabase"
        ? { apikey: token, Authorization: `Bearer ${token}` }
        : { Authorization: `Bearer ${token}` },
  });
}
