export type TenantReadTable =
  | 'suppliers' | 'categories' | 'products' | 'batches' | 'inventory'
  | 'inventory_transactions' | 'prices' | 'carts' | 'cart_items'
  | 'orders' | 'order_items' | 'payments' | 'deliveries' | 'reviews'
  | 'complaints' | 'subscriptions' | 'posts' | 'post_interactions'
  | 'post_medias' | 'group_buys' | 'group_buy_members';
export type TenantWriteTable = 'products' | 'categories';
export interface TenantTableMetadata { id:string;sort:string;descending:boolean }
export const TENANT_TABLES:Readonly<Record<TenantReadTable,TenantTableMetadata>>;
export const TENANT_WRITABLE_FIELDS:Readonly<Record<TenantWriteTable,readonly string[]>>;
export const TENANT_SELECTS:Readonly<Record<TenantWriteTable,string>>;
export function tenantTableMeta(table:TenantReadTable):TenantTableMetadata;
export function validateTenantWrite(table:TenantWriteTable,record:Record<string,unknown>,storeId:string,inserting:boolean):Record<string,unknown>;
