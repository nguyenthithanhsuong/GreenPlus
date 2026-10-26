import test from 'node:test';import assert from 'node:assert/strict';import {readdirSync,readFileSync} from 'node:fs';import {join} from 'node:path';
const root=new URL('../supabase/migrations/',import.meta.url);const files=readdirSync(root).filter(f=>/^\d{4}_.*\.sql$/.test(f)).sort();
test('migration filenames unique and sequential 0001–0010',()=>{assert.deepEqual(files.map(x=>Number(x.slice(0,4))),Array.from({length:10},(_,i)=>i+1));});
test('phase A does not claim tenant isolation',()=>{const sql=readFileSync(new URL('0010_transition_diagnostics.sql',root),'utf8');assert.match(sql,/NOT mean tenant isolation is enforced/);assert.match(sql,/store_id IS NULL/);});
