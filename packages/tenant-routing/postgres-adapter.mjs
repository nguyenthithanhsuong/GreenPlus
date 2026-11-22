/** PostgreSQL CRUD port with strict identifier/column allowlists and tenant scoping.
 * Pass an already-created pg Pool/Client; never accept a connection string from HTTP.
 * This is a server-only building block, not a production transport switch.
 */
import { TenantDataError } from './postgrest-adapter.mjs';
import { TENANT_TABLES, validateTenantWrite } from './tenant-schema.mjs';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IDENTIFIER=/^[a-z][a-z_0-9]{0,62}$/;
export const TENANT_READ_TABLES = Object.freeze(Object.fromEntries(
  Object.entries(TENANT_TABLES).map(([table,meta])=>[table,{id:meta.id,order:`${meta.sort} ${meta.descending?'DESC':'ASC'}`}])
));
function checkedId(value){if(typeof value!=='string'||!UUID.test(value))throw new TenantDataError('Invalid record identifier');return value;}
function meta(table){if(!Object.hasOwn(TENANT_READ_TABLES,table))throw new TenantDataError('Unsupported tenant table');return TENANT_READ_TABLES[table];}
function writable(table){
  if(!Object.hasOwn(TENANT_TABLES,table))throw new TenantDataError('Unsupported tenant table');
  if(!['products','categories'].includes(table))throw new TenantDataError('Writes require a dedicated validated domain service');
}
function body(table,payload,storeId,inserting){
  try{return Object.entries(validateTenantWrite(table,payload,storeId,inserting));}
  catch(error){throw new TenantDataError(error.message);}
}
function assertRows(rows,storeId){
  if(!Array.isArray(rows)||rows.some(row=>!row||row.store_id!==storeId))throw new TenantDataError('Cross-tenant or malformed database result');
  return rows;
}
export function createTenantPostgresAdapter({route,pool}){
  if(!route||!UUID.test(route.storeId??'')||!IDENTIFIER.test(route.schema??'')||!pool||typeof pool.query!=='function')
    throw new TenantDataError('Unresolved PostgreSQL tenant connection');
  // Route schema was resolved from trusted server config; it is never HTTP input.
  const schema=`"${route.schema}"`;
  const storeId=route.storeId;
  async function execute(sql,values){
    let rows;
    try{const result=await pool.query(sql,values);rows=result?.rows;}
    catch{throw new TenantDataError('Tenant PostgreSQL query unavailable');}
    return assertRows(rows,storeId);
  }
  function baseTable(table){meta(table);return `${schema}."${table}"`;}
  return Object.freeze({
    async list(table,options={}){
      const {order}=meta(table);
      const limit=options.limit??100,offset=options.offset??0;
      if(!Number.isInteger(limit)||limit<1||limit>500||!Number.isInteger(offset)||offset<0||offset>1000000)
        throw new TenantDataError('Invalid pagination');
      return execute(`SELECT * FROM ${baseTable(table)} WHERE store_id=$1 ORDER BY ${order} LIMIT $2 OFFSET $3`,[storeId,limit,offset]);
    },
    async find(table,id){
      const {id:pk}=meta(table);
      const rows=await execute(`SELECT * FROM ${baseTable(table)} WHERE store_id=$1 AND "${pk}"=$2 LIMIT 1`,[storeId,checkedId(id)]);
      return rows[0]??null;
    },
    async insert(table,record){
      const entries=body(table,record,storeId,true);
      const keys=entries.map(([key])=>`"${key}"`).join(',');
      const placeholders=entries.map((_,i)=>`$${i+1}`).join(',');
      const rows=await execute(`INSERT INTO ${baseTable(table)} (${keys}) VALUES (${placeholders}) RETURNING *`,entries.map(([,val])=>val));
      if(rows.length!==1)throw new TenantDataError('Unexpected insert count');
      return rows[0];
    },
    async update(table,id,record){
      writable(table);
      const {id:pk}=meta(table);
      const entries=body(table,record,storeId,false);
      const assigns=entries.map(([key],i)=>`"${key}"=$${i+3}`).join(',');
      const rows=await execute(`UPDATE ${baseTable(table)} SET ${assigns} WHERE store_id=$1 AND "${pk}"=$2 RETURNING *`,
        [storeId,checkedId(id),...entries.map(([,val])=>val)]);
      if(rows.length>1)throw new TenantDataError('Unexpected update count');
      return rows[0]??null;
    },
    async delete(table,id){
      writable(table);
      const {id:pk}=meta(table);
      const rows=await execute(`DELETE FROM ${baseTable(table)} WHERE store_id=$1 AND "${pk}"=$2 RETURNING store_id`,[storeId,checkedId(id)]);
      if(rows.length>1)throw new TenantDataError('Unexpected delete count');
      return rows.length===1;
    },
  });
}
