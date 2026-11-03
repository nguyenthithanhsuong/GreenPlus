/** Disposable SQL contract checks for Docker-only Product/Category slice.
 * Requires an already-running `docker compose` demo and SQL 002 applied.
 * Every test is wrapped in a transaction ending with ROLLBACK.
 */
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dir = resolve(dirname(fileURLToPath(import.meta.url)), "../docker/three-tier");
const targets = [
  { service: "shared-db", database: "greenplus_demo", schema: "public", label: "Regular/shared" },
  { service: "shared-db", database: "greenplus_demo", schema: "pro_a", label: "Pro/schema A" },
  { service: "shared-db", database: "greenplus_demo", schema: "pro_b", label: "Pro/schema B" },
  { service: "enterprise-a-db", database: "enterprise_a", schema: "public", label: "Enterprise/database A" },
  { service: "enterprise-b-db", database: "enterprise_b", schema: "public", label: "Enterprise/database B" },
];

function sqlFor(schema) {
  // Schema values are the fixed internal allowlist above, never request input.
  const [storeA, storeB, categoryA, productA, attemptedB] = Array.from({ length: 5 }, () => randomUUID());
  return `\nBEGIN;
INSERT INTO ${schema}.categories(category_id,store_id,name)
VALUES ('${categoryA}','${storeA}','Commerce check');
INSERT INTO ${schema}.products(product_id,store_id,category_id,name,unit)
VALUES ('${productA}','${storeA}','${categoryA}','Commerce check','kg');
DO $verify$
BEGIN
  IF (SELECT count(*) FROM ${schema}.products WHERE product_id='${productA}' AND store_id='${storeA}') <> 1 THEN
    RAISE EXCEPTION 'Authenticated store predicate does not return its row';
  END IF;
  IF (SELECT count(*) FROM ${schema}.products WHERE product_id='${productA}' AND store_id='${storeB}') <> 0 THEN
    RAISE EXCEPTION 'Store-scoped query leaked a different row';
  END IF;
  BEGIN
    INSERT INTO ${schema}.products(product_id,store_id,category_id,name,unit)
    VALUES ('${attemptedB}','${storeB}','${categoryA}','Wrong tenant category','kg');
    RAISE EXCEPTION 'Cross-tenant category assignment was permitted';
  EXCEPTION WHEN foreign_key_violation THEN
    NULL; -- Required: a product cannot reference another store's category.
  END;
END
$verify$;
ROLLBACK;
`;
}

let failures = 0;
for (const target of targets) {
  try {
    const output = execFileSync("docker", [
      "compose", "exec", "-T", target.service,
      "psql", "-X", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", target.database,
    ], { cwd: dir, input: sqlFor(target.schema), encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], timeout: 30000 });
    if (!output.includes("ROLLBACK")) throw new Error("Transaction was not rolled back");
    console.log(`PASS ${target.label}: schema, scoped query, cross-store FK (rolled back)`);
  } catch (error) {
    failures++;
    console.error(`FAIL ${target.label}: ${error instanceof Error ? (error.stderr?.toString() || error.message) : String(error)}`);
  }
}
if (failures) {
  console.error(`${failures} Docker SQL checks failed. Make sure services are up and SQL 002 was applied.`);
  process.exitCode = 1;
} else {
  console.log("All five Docker SQL contract checks passed (no persistent data written).");
}
