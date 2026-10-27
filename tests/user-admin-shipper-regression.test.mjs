import { test } from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {storeUserRoleAllowed, assignedStoreMap, publicStoreIds} from '../web-admin/backend/core/store-user-scope.mjs';
import {verifiedUserAddress} from '../web-admin/backend/core/user-address.mjs';
const read = p => readFileSync(new URL(p, import.meta.url), 'utf8');

test('role policy lets Manager view assigned employees, shippers and customers, not privileged accounts',()=>{
  assert.equal(storeUserRoleAllowed({is_employee:true}),true);
  assert.equal(storeUserRoleAllowed({is_shipper:true}),true);
  assert.equal(storeUserRoleAllowed({is_customer:true}),true);
  assert.equal(storeUserRoleAllowed({is_admin:true,is_employee:true}),false);
  assert.equal(storeUserRoleAllowed({is_manager:true,is_employee:true}),false);
});
test('store association keeps separate stores and order customers even without users.store_id',()=>{
  const map=assignedStoreMap(['store-A'],[{user_id:'staff',store_id:'store-A'},{user_id:'leak',store_id:'store-B'}],
  [{user_id:'customer',store_id:'store-A'}],[{employee_id:'shipper',store_id:'store-A'}],[]);
  assert.deepEqual(publicStoreIds(map,'staff'),['store-A']);
  assert.deepEqual(publicStoreIds(map,'customer'),['store-A']);
  assert.deepEqual(publicStoreIds(map,'shipper'),['store-A']);
  assert.deepEqual(publicStoreIds(map,'leak'),[]);
});
test('server location requires nonblank address and recomputes coordinates',async()=>{
  await assert.rejects(()=>verifiedUserAddress('',async()=>({latitude:10,longitude:106})),/địa chỉ/);
  const result=await verifiedUserAddress(' 1 Nguyễn Văn A, Dĩ An ',async(q)=>{
    assert.equal(q,'1 Nguyễn Văn A, Dĩ An'); return {latitude:10.902,longitude:106.8};
  });
  assert.deepEqual(result,{address:'1 Nguyễn Văn A, Dĩ An',latitude:10.902,longitude:106.8});
});
test('manager user listing is store-associated, API retains server validation and profile image URL',()=>{
  const list=read('../web-admin/src/app/api/users/route.ts');
  assert.match(list,/managerStoreIds\(actor\.id\)/);
  assert.match(list,/storeUserRoleAllowed\(role\)/);
  assert.match(list,/fetchRelationships\("orders"/);
  assert.match(list,/fetchRelationships\("deliveries"/);
  assert.match(list,/verifiedUserAddress/);
  assert.match(read('../web-admin/src/app/api/users/[userId]/route.ts'),/verifiedUserAddress/);
  assert.match(read('../web-shipper/src/server/shipper-auth.ts'),/status,image_url/);
  assert.match(read('../web-shipper/src/frontend/profile/Profile.tsx'),/src=\{user\.image_url\}/);
  assert.match(read('../web-admin/frontend/shared/AdminShell.tsx'),/scrollbar-gutter:stable/);
});
