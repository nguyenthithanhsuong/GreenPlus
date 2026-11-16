/**
 * Live, rollback-only audit/RBAC/promotion probe on all five Docker storage scopes.
 * Requires successful `npm run docker:three-tier:migrate` first.
 * Does NOT mutate committed data, reset volumes, or connect to Supabase.
 */
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../docker/three-tier');
const targets = [
  ['shared-db', 'greenplus_demo', ['public', 'pro_a', 'pro_b']],
  ['enterprise-a-db', 'enterprise_a', ['public']],
  ['enterprise-b-db', 'enterprise_b', ['public']],
];
function probe(schema) {
  if (!['public','pro_a','pro_b'].includes(schema)) throw new Error('Invalid schema');
  return `BEGIN;
    SET LOCAL statement_timeout='10s';
    SELECT set_config('greenplus.probe_store',gen_random_uuid()::text,true);
    SELECT set_config('greenplus.probe_product',gen_random_uuid()::text,true);
    INSERT INTO ${schema}.products(product_id,store_id,name,price)
      VALUES(current_setting('greenplus.probe_product')::uuid,current_setting('greenplus.probe_store')::uuid,'Rollback-only probe',5000);
    INSERT INTO ${schema}.inventory_stock(store_id,product_id,available)
      VALUES(current_setting('greenplus.probe_store')::uuid,current_setting('greenplus.probe_product')::uuid,3);
    UPDATE ${schema}.products SET name='Updated rollback-only probe'
      WHERE product_id=current_setting('greenplus.probe_product')::uuid;
    INSERT INTO ${schema}.promotions(store_id,scope,product_id,discount_type,discount_value,start_at,end_at,status,image_url)
      VALUES(current_setting('greenplus.probe_store')::uuid,'product',current_setting('greenplus.probe_product')::uuid,
        'percentage',10,now(),now()+interval '1 day','active','https://example.test/promotion.jpg');
    DO $probe$
    DECLARE hits integer; rejected boolean := false;
    BEGIN
      SELECT count(*) INTO hits FROM ${schema}.audit_logs
      WHERE store_id=current_setting('greenplus.probe_store')::uuid
        AND ((entity='products' AND action='products.insert') OR
             (entity='products' AND action='products.update') OR
             (entity='inventory_stock' AND action='inventory_stock.insert') OR
             (entity='promotions' AND action='promotions.insert'));
      IF hits<>4 THEN RAISE EXCEPTION 'Expected exactly 4 audit entries, got %',hits; END IF;
      IF EXISTS (SELECT 1 FROM ${schema}.audit_logs WHERE store_id=current_setting('greenplus.probe_store')::uuid
        AND (before_data::text ILIKE '%password%' OR after_data::text ILIKE '%password%'))
      THEN RAISE EXCEPTION 'Sensitive fields leaked to audit'; END IF;
      BEGIN
        INSERT INTO ${schema}.promotions(store_id,scope,product_id,discount_type,discount_value,start_at,end_at)
          VALUES(gen_random_uuid(),'product',current_setting('greenplus.probe_product')::uuid,
            'percentage',10,now(),now()+interval '1 day');
      EXCEPTION WHEN foreign_key_violation THEN rejected := true;
      END;
      IF NOT rejected THEN RAISE EXCEPTION 'Cross-store promotion accepted'; END IF;
    END $probe$;
    SELECT 'PASS' AS rollback_only_probe;
    ROLLBACK;`;
}
try {
  for (const [svc, db, schemas] of targets) for (const schema of schemas) {
    const cmd = ['compose','--project-directory',root,'exec','-T',svc,'psql','-X','-A','-t',
      '-v','ON_ERROR_STOP=1','-U','postgres','-d',db,'-c',probe(schema)];
    const r = spawnSync('docker',cmd,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:30000,windowsHide:true});
    if (r.error || r.status!==0 || !r.stdout?.split(/\r?\n/).some(line=>line.trim()==='PASS'))
      throw new Error(`${svc}/${schema} probe failed: ${r.error?.message ?? r.stderr ?? 'missing PASS'}`);
    console.log(`PASS ${svc}/${schema}: trigger audit, image promotion, cross-store FK, rollback`);
  }
  console.log('All five transactional probes rolled back successfully.');
} catch(error) { console.error(`ERROR: ${error.message}`);process.exitCode=1; }
