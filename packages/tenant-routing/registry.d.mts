export type StorageTier = "regular" | "pro" | "enterprise";
export type StorageProvider = "supabase-postgres" | "docker-postgres" | "external-postgres";
export interface TenantStorageRecord {
  store_id: string;
  storage_tier: StorageTier;
  storage_provider: StorageProvider;
  storage_key: string;
  provisioning_state: "pending" | "provisioning" | "ready" | "failed" | "disabled";
}
export interface StorageTarget {
  tier: StorageTier;
  kind: "supabase" | "postgrest";
  databaseKey: string;
  schema: string;
  url: string;
}
export interface TenantDataRoute {
  storeId: string;
  tier: StorageTier;
  provider: StorageProvider;
  storageKey: string;
  kind: "supabase" | "postgrest";
  schema: string;
  databaseKey: string;
  url: string;
}
export class TenantRoutingError extends Error {}
export function validateStorageRecord(storeId: string, record: unknown): Readonly<Pick<TenantDataRoute, "storeId" | "tier" | "provider" | "storageKey">>;
export function resolveTenantDataRoute(options: {
  storeId: string;
  record: unknown;
  targets: Record<string, StorageTarget>;
}): Readonly<TenantDataRoute>;
