import type { TenantDataRoute } from "./registry.mjs";
export type TenantCollection = "products" | "categories";
export type TenantRow = Record<string, unknown>;
export interface TenantPostgrestAdapter {
  list(collection: TenantCollection, options?: { limit?: number; offset?: number }): Promise<TenantRow[]>;
  find(collection: TenantCollection, id: string): Promise<TenantRow | null>;
  insert(collection: TenantCollection, record: TenantRow): Promise<TenantRow>;
  update(collection: TenantCollection, id: string, record: TenantRow): Promise<TenantRow | null>;
  delete(collection: TenantCollection, id: string): Promise<boolean>;
}
export class TenantDataError extends Error {}
export function createTenantPostgrestAdapter(options: {
  route: TenantDataRoute;
  headers: Record<string, string>;
  fetchImpl?: typeof fetch;
}): TenantPostgrestAdapter;
