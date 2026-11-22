import type {TenantDataRoute} from './registry.mjs';
import type {TenantReadTable,TenantWriteTable} from './tenant-schema.mjs';
export type TenantCollection = TenantReadTable;
export type TenantRow = Record<string,unknown>;
export interface TenantPostgrestAdapter {
  list(collection:TenantReadTable,options?:{limit?:number;offset?:number}):Promise<TenantRow[]>;
  find(collection:TenantReadTable,id:string):Promise<TenantRow|null>;
  insert(collection:TenantWriteTable,record:TenantRow):Promise<TenantRow>;
  update(collection:TenantWriteTable,id:string,record:TenantRow):Promise<TenantRow|null>;
  delete(collection:TenantWriteTable,id:string):Promise<boolean>;
}
export class TenantDataError extends Error {}
export function createTenantPostgrestAdapter(options:{
  route:TenantDataRoute;headers:Record<string,string>;fetchImpl?:typeof fetch;
}):TenantPostgrestAdapter;
