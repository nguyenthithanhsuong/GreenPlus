/**
 * Shared PostgreSQL/PostgREST tenant read contract derived from migrations
 * 0001_baseline_greenplus.sql + 0005_add_store_scope.sql.
 * A table being listed here does NOT grant permission to access it: the
 * server's authenticated RBAC check must precede adapter construction, and
 * PostgreSQL RLS remains the final enforcement boundary.
 *
 * Writes are deliberately supported only for Products and Categories.
 * Multi-row inventory, checkout, payment and delivery changes need existing
 * transactional business services, not generic table CRUD.
 */
export const TENANT_TABLES = Object.freeze({
  suppliers: {id:'supplier_id',sort:'created_at',descending:true},
  categories: {id:'category_id',sort:'name',descending:false},
  products: {id:'product_id',sort:'created_at',descending:true},
  batches: {id:'batch_id',sort:'created_at',descending:true},
  inventory: {id:'inventory_id',sort:'last_updated',descending:true},
  inventory_transactions: {id:'transaction_id',sort:'created_at',descending:true},
  prices: {id:'price_id',sort:'created_at',descending:true},
  carts: {id:'cart_id',sort:'created_at',descending:true},
  cart_items: {id:'cart_item_id',sort:'created_at',descending:true},
  orders: {id:'order_id',sort:'created_at',descending:true},
  order_items: {id:'order_item_id',sort:'order_id',descending:false},
  payments: {id:'payment_id',sort:'payment_id',descending:true},
  deliveries: {id:'delivery_id',sort:'delivery_id',descending:true},
  reviews: {id:'review_id',sort:'created_at',descending:true},
  complaints: {id:'complaint_id',sort:'created_at',descending:true},
  subscriptions: {id:'subscription_id',sort:'start_date',descending:true},
  posts: {id:'post_id',sort:'created_at',descending:true},
  post_interactions: {id:'interaction_id',sort:'created_at',descending:true},
  post_medias: {id:'media_id',sort:'media_id',descending:true},
  group_buys: {id:'group_id',sort:'deadline',descending:true},
  group_buy_members: {id:'id',sort:'joined_at',descending:true},
});
export const TENANT_WRITABLE_FIELDS = Object.freeze({
  products: Object.freeze(['category_id','name','description','unit','image_url','status','nutrition']),
  categories: Object.freeze(['name','description','image_url']),
});
export const TENANT_SELECTS = Object.freeze({
  products:'product_id,store_id,category_id,name,description,unit,image_url,status,created_at,nutrition,categories(name)',
  categories:'category_id,store_id,name,description,image_url,created_at',
});
export function tenantTableMeta(table) {
  if (!Object.hasOwn(TENANT_TABLES,table))throw new Error('Unsupported tenant table');
  return TENANT_TABLES[table];
}
export function validateTenantWrite(table,record,storeId,inserting) {
  tenantTableMeta(table);
  const allowed=TENANT_WRITABLE_FIELDS[table];
  if(!allowed)throw new Error('Writes require a dedicated validated domain service');
  if(!record||typeof record!=='object'||Array.isArray(record))throw new Error('Invalid tenant write payload');
  if(Object.hasOwn(record,'store_id')&&(!inserting||record.store_id!==storeId))throw new Error('Tenant ownership cannot be changed');
  const entries=Object.entries(record).filter(([key])=>key!=='store_id');
  if(entries.length===0)throw new Error('Empty tenant write payload');
  if(entries.some(([key])=>!allowed.includes(key)))throw new Error('Unsupported write field');
  return inserting?Object.fromEntries([...entries,['store_id',storeId]]):Object.fromEntries(entries);
}
