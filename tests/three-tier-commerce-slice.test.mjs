import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const shared = read("../docker/three-tier/sql/shared/002_product_category_slice.sql");
const enterpriseA = read("../docker/three-tier/sql/enterprise-a/002_product_category_slice.sql");
const enterpriseB = read("../docker/three-tier/sql/enterprise-b/002_product_category_slice.sql");

for (const [tier, sql] of [["Regular/Pro", shared], ["Enterprise A", enterpriseA], ["Enterprise B", enterpriseB]]) {
  test(`${tier} upgrade is transactional and explicitly Docker-only`, () => {
    assert.match(sql, /Docker lab ONLY/);
    assert.match(sql, /\bBEGIN;/);
    assert.match(sql, /\bCOMMIT;/);
  });
  test(`${tier} supports adapter's Product/Category columns`, () => {
    for (const column of ["category_id", "store_id", "name", "description", "image_url", "created_at"]) {
      assert.match(sql, new RegExp(`\\b${column}\\b`));
    }
    for (const column of ["unit", "status", "nutrition"]) assert.match(sql, new RegExp(`\\b${column}\\b`));
  });
  test(`${tier} rejects cross-store category references by composite FK`, () => {
    assert.match(sql, /FOREIGN KEY \(store_id, category_id\)/);
    assert.match(sql, /REFERENCES .*categories\s*\(store_id, category_id\)/);
  });
}
test("Pro upgrades only fixed schema names", () => {
  assert.match(shared, /ARRAY\['pro_a','pro_b'\]/);
  assert.doesNotMatch(shared, /request\.headers|process\.env/);
});
test("Enterprise slots get the same adapter-facing schema", () => assert.equal(enterpriseA, enterpriseB));
test("live SQL probe never commits its checks", () => {
  const probe = read("../scripts/test-three-tier-commerce.mjs");
  assert.match(probe, /ROLLBACK;/);
  assert.doesNotMatch(probe, /COMMIT;/);
});
test("Shipper has a Sentry global error boundary", () => {
  const globalError = read("../web-shipper/src/app/global-error.tsx");
  assert.match(globalError, /Sentry\.captureException\(error\)/);
  assert.match(globalError, /<Error statusCode=\{500\}/);
});
