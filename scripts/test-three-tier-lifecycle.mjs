/** Local Docker-only lifecycle integration tests. All data is rolled back, including event history. */
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const cwd=resolve(dirname(fileURLToPath(import.meta.url)),'../docker/three-tier');
const targets=[
  ['shared-db','greenplus_demo','public','Regular'],
  ['shared-db','greenplus_demo','pro_a','Pro A'],
  ['shared-db','greenplus_demo','pro_b','Pro B'],
  ['enterprise-a-db','enterprise_a','public','Enterprise A'],
  ['enterprise-b-db','enterprise_b','public','Enterprise B'],
];
function build(schema) {
  const [store,other,category,product,order,unpaidOrder]=Array.from({length:6},randomUUID);
  return `BEGIN;
INSERT INTO ${schema}.categories(category_id,store_id,name) VALUES ('${category}','${store}','Lifecycle rollback test');
INSERT INTO ${schema}.products(product_id,store_id,category_id,name,unit,price,status) VALUES ('${product}','${store}','${category}','Lifecycle rollback test','kg',5000,'active');
DO $test$
DECLARE r jsonb; balance integer; events integer;
BEGIN
 r := ${schema}.demo_restock('${store}','${product}',8);
 r := ${schema}.demo_checkout('${store}','${order}','[{"product_id":"${product}","quantity":2}]'::jsonb);
 IF (r->>'total')::numeric<>10000 THEN RAISE EXCEPTION 'Wrong checkout total'; END IF;
 BEGIN
  PERFORM ${schema}.demo_checkout('${store}','${order}','[{"product_id":"${product}","quantity":3}]'::jsonb);
  RAISE EXCEPTION 'Idempotency key reused with changed items';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM='Idempotency key reused with changed items' THEN RAISE; END IF; END;
 BEGIN
  PERFORM ${schema}.demo_confirm_payment('${other}','${order}');
  RAISE EXCEPTION 'Cross-store payment allowed';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM='Cross-store payment allowed' THEN RAISE; END IF; END;
 BEGIN
  PERFORM ${schema}.demo_assign_delivery('${store}','${order}','Test Courier');
  RAISE EXCEPTION 'Unpaid delivery allowed';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM='Unpaid delivery allowed' THEN RAISE; END IF; END;
 r := ${schema}.demo_confirm_payment('${store}','${order}');
 IF r->>'payment_status'<>'paid' OR (r->>'replayed')::boolean THEN RAISE EXCEPTION 'Payment failed'; END IF;
 r := ${schema}.demo_confirm_payment('${store}','${order}');
 IF NOT (r->>'replayed')::boolean THEN RAISE EXCEPTION 'Payment replay not idempotent'; END IF;
 BEGIN
  PERFORM ${schema}.demo_cancel_order('${store}','${order}');
  RAISE EXCEPTION 'Paid order cancellation allowed';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM='Paid order cancellation allowed' THEN RAISE; END IF; END;
 r := ${schema}.demo_assign_delivery('${store}','${order}','Test Courier');
 IF r->>'delivery_status'<>'assigned' OR (r->>'replayed')::boolean THEN RAISE EXCEPTION 'Assignment failed'; END IF;
 r := ${schema}.demo_assign_delivery('${store}','${order}','Test Courier');
 IF NOT (r->>'replayed')::boolean THEN RAISE EXCEPTION 'Assignment replay failed'; END IF;
 BEGIN
  PERFORM ${schema}.demo_assign_delivery('${store}','${order}','Wrong Courier');
  RAISE EXCEPTION 'Reassignment allowed';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM='Reassignment allowed' THEN RAISE; END IF; END;
 BEGIN
  PERFORM ${schema}.demo_complete_delivery('${other}','${order}');
  RAISE EXCEPTION 'Cross-store delivery allowed';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM='Cross-store delivery allowed' THEN RAISE; END IF; END;
 r := ${schema}.demo_complete_delivery('${store}','${order}');
 IF r->>'delivery_status'<>'delivered' OR (r->>'replayed')::boolean THEN RAISE EXCEPTION 'Delivery failed'; END IF;
 r := ${schema}.demo_complete_delivery('${store}','${order}');
 IF NOT (r->>'replayed')::boolean THEN RAISE EXCEPTION 'Delivery replay failed'; END IF;
 SELECT count(*) INTO events FROM ${schema}.commerce_events WHERE store_id='${store}' AND order_id='${order}';
 IF events<>3 THEN RAISE EXCEPTION 'Expected exactly three lifecycle events'; END IF;
 r := ${schema}.demo_checkout('${store}','${unpaidOrder}','[{"product_id":"${product}","quantity":1}]'::jsonb);
 r := ${schema}.demo_cancel_order('${store}','${unpaidOrder}');
 r := ${schema}.demo_cancel_order('${store}','${unpaidOrder}');
 IF NOT (r->>'replayed')::boolean THEN RAISE EXCEPTION 'Cancellation replay failed'; END IF;
 SELECT available INTO balance FROM ${schema}.inventory_stock WHERE store_id='${store}' AND product_id='${product}';
 IF balance<>6 THEN RAISE EXCEPTION 'Incorrect stock after cancellation'; END IF;
END $test$;
ROLLBACK;`;
}
let failed=0;
for(const [service,db,schema,label] of targets) {
 try {
  const stdout=execFileSync('docker',['compose','exec','-T',service,'psql','-X','-v','ON_ERROR_STOP=1','-U','postgres','-d',db],
   {cwd,input:build(schema),encoding:'utf8',stdio:['pipe','pipe','pipe'],timeout:120000});
  if(!stdout.includes('ROLLBACK')) throw new Error('No ROLLBACK confirmation');
  console.log(`PASS ${label}: payment simulation, fulfillment, idempotency, cross-tenant checks, cancellation; ROLLBACK`);
 } catch(error) {failed++;console.error(`FAIL ${label}: ${error.stderr?.toString() || error.message}`);}
}
if(failed)process.exitCode=1;
else console.log('All five storage areas passed. No test records persisted.');
