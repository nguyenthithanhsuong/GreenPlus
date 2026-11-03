/** Destructive-action-free Docker transaction test: every target runs inside BEGIN/ROLLBACK.
 * Run only against local Docker lab. No real checkout, persistent writes, or external payment calls.
 */
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../docker/three-tier');
const targets = [
  ['shared-db', 'greenplus_demo', 'public', 'Regular'],
  ['shared-db', 'greenplus_demo', 'pro_a', 'Pro A'],
  ['shared-db', 'greenplus_demo', 'pro_b', 'Pro B'],
  ['enterprise-a-db', 'enterprise_a', 'public', 'Enterprise A'],
  ['enterprise-b-db', 'enterprise_b', 'public', 'Enterprise B'],
];
function sql(schema) {
  const [store, outsider, cat, product, order, failedOrder] = Array.from({length:6}, randomUUID);
  return `BEGIN;
INSERT INTO ${schema}.categories(category_id,store_id,name) VALUES ('${cat}','${store}','Tx rollback test');
INSERT INTO ${schema}.products(product_id,store_id,category_id,name,unit,price,status) VALUES ('${product}','${store}','${cat}','Tx rollback test','kg',12000,'active');
DO $tx$
DECLARE result jsonb; balance integer; total_orders integer;
BEGIN
 result := ${schema}.demo_restock('${store}','${product}',10);
 IF (result->>'available')::int <> 10 THEN RAISE EXCEPTION 'Restock failed'; END IF;
 result := ${schema}.demo_checkout('${store}','${order}', '[{"product_id":"${product}","quantity":3}]'::jsonb);
 IF (result->>'total')::numeric <> 36000 OR (result->>'replayed')::boolean THEN RAISE EXCEPTION 'Checkout failed'; END IF;
 result := ${schema}.demo_checkout('${store}','${order}', '[{"product_id":"${product}","quantity":3}]'::jsonb);
 IF NOT (result->>'replayed')::boolean THEN RAISE EXCEPTION 'Retry should be idempotent'; END IF;
 SELECT available INTO balance FROM ${schema}.inventory_stock WHERE store_id='${store}' AND product_id='${product}';
 IF balance <> 7 THEN RAISE EXCEPTION 'Double decrement on replay'; END IF;
 BEGIN
   PERFORM ${schema}.demo_checkout('${store}','${failedOrder}', '[{"product_id":"${product}","quantity":9}]'::jsonb);
   RAISE EXCEPTION 'Overselling permitted';
 EXCEPTION WHEN OTHERS THEN
   IF SQLERRM = 'Overselling permitted' THEN RAISE; END IF;
 END;
 SELECT count(*) INTO total_orders FROM ${schema}.commerce_orders WHERE order_id='${failedOrder}';
 IF total_orders <> 0 THEN RAISE EXCEPTION 'Failed checkout persisted'; END IF;
 BEGIN
   PERFORM ${schema}.demo_restock('${outsider}','${product}',1);
   RAISE EXCEPTION 'Cross-tenant restock permitted';
 EXCEPTION WHEN OTHERS THEN
   IF SQLERRM = 'Cross-tenant restock permitted' THEN RAISE; END IF;
 END;
 result := ${schema}.demo_cancel_order('${store}','${order}');
 IF (result->>'status') <> 'cancelled' OR (result->>'replayed')::boolean THEN RAISE EXCEPTION 'Cancel failed'; END IF;
 result := ${schema}.demo_cancel_order('${store}','${order}');
 IF NOT (result->>'replayed')::boolean THEN RAISE EXCEPTION 'Cancel retry not idempotent'; END IF;
 SELECT available INTO balance FROM ${schema}.inventory_stock WHERE store_id='${store}' AND product_id='${product}';
 IF balance <> 10 THEN RAISE EXCEPTION 'Stock not restored exactly once'; END IF;
END $tx$;
ROLLBACK;`;
}
let failures = 0;
for (const [service, database, schema, label] of targets) {
  try {
    const output = execFileSync('docker', ['compose', 'exec', '-T', service, 'psql', '-X', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', database], {
      cwd:root, input:sql(schema), encoding:'utf8', stdio:['pipe','pipe','pipe'], timeout:120000,
    });
    if (!output.includes('ROLLBACK')) throw new Error('Missing final ROLLBACK');
    console.log(`PASS ${label}: restock, checkout, retry, oversell rollback, tenant isolation, cancellation (rolled back)`);
  } catch (error) {
    failures++;
    console.error(`FAIL ${label}: ${error.stderr?.toString() || error.message}`);
  }
}
if (failures) process.exitCode = 1;
else console.log('All five database tiers/schemas passed; test data rolled back.');
