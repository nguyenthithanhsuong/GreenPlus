import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canAccessPage,canAccessApi} from '../web-admin/src/lib/portal-access.ts';
const admin=['/dashboard','/users','/roles','/greencreators','/settings/stores'];
const manager=['/dashboard','/users','/suppliers','/products','/categories','/batches','/inventories','/prices','/orders','/shippers','/complaints','/customers','/greencreators','/reports'];
const employee=['/dashboard','/suppliers','/products','/categories','/batches','/inventories','/prices','/orders','/complaints'];
test('admin portal excludes store operations',()=>{
 for(const path of admin)assert.ok(canAccessPage('admin',path),path);
 for(const path of ['/products','/orders','/suppliers','/settings/store'])assert.equal(canAccessPage('admin',path),false,path);
});
test('manager screens include assigned-store functions but exclude platform management',()=>{
 for(const path of manager)assert.ok(canAccessPage('manager',path),path);
 for(const path of ['/roles','/settings/stores'])assert.equal(canAccessPage('manager',path),false,path);
});
test('employee menu is limited',()=>{
 for(const path of employee)assert.ok(canAccessPage('employee',path),path);
 for(const path of ['/users','/roles','/shippers','/reports','/greencreators'])assert.equal(canAccessPage('employee',path),false,path);
});
test('API guard rejects forbidden paths or mutations',()=>{
 assert.equal(canAccessApi('employee','/api/users','GET'),false);
 assert.equal(canAccessApi('manager','/api/roles','POST'),false);
 assert.equal(canAccessApi('manager','/api/roles','GET'),true);
 assert.equal(canAccessApi('employee','/api/deliveries','POST'),false);
 assert.equal(canAccessApi('admin','/api/products','GET'),false);
});
