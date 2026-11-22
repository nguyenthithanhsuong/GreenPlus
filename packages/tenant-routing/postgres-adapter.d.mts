import type {TenantReadTable,TenantWriteTable} from './tenant-schema.mjs';
export interface PgQueryPort { query(sql:string,values:unknown[]):Promise<{rows:Record<string,unknown>[]}> }
export interface TenantPgRoute {storeId:string;schema:string}
export interface TenantCrudAdapter {
  list(table:TenantReadTable,options?:{limit?:number;offset?:number}):Promise<Record<string,unknown>[]>;
  find(table:TenantReadTable,id:string):Promise<Record<string,unknown>|null>;
  insert(table:TenantWriteTable,record:Record<string,unknown>):Promise<Record<string,unknown>>;
  update(table:TenantWriteTable,id:string,record:Record<string,unknown>):Promise<Record<string,unknown>|null>;
  delete(table:TenantWriteTable,id:string):Promise<boolean>;
}
export const TENANT_READ_TABLES:Readonly<Record<TenantReadTable,{id:string;order:string}>>;
export function createTenantPostgresAdapter(input:{route:TenantPgRoute;pool:PgQueryPort}):TenantCrudAdapter;
