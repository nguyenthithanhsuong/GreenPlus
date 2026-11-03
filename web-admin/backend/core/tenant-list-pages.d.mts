import type { TenantCollection, TenantPostgrestAdapter, TenantRow } from '../../../packages/tenant-routing/postgrest-adapter.mjs';
export function listTenantCollection(adapter: TenantPostgrestAdapter, collection: TenantCollection, bounds?: {pageSize?: number; maxRows?: number}): Promise<TenantRow[]>;
