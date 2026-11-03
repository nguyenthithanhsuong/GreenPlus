import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

async function mockRest() {
  const entries = [];
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, "http://internal");
    if (req.method === "POST") {
      let str = "";
      for await (const chunk of req) str += chunk;
      const value = JSON.parse(str);
      entries.push({ path: url.pathname, schema: req.headers["content-profile"], value });
      res.writeHead(201, { "Content-Type": "application/json" }); res.end(JSON.stringify([value])); return;
    }
    if (req.method === "DELETE") {
      res.writeHead(204); res.end(); return;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    if (url.pathname === "/demo_stores") res.end(JSON.stringify(entries.filter(e => e.path === "/demo_stores").map(e => e.value)));
    else if (url.pathname === "/products" || url.pathname === "/demo_products") res.end(JSON.stringify(entries.filter(e => e.path === url.pathname && (e.schema || "public") === (req.headers["accept-profile"] || "public")).map(e => e.value).filter(e => !url.searchParams.has("store_id") || `eq.${e.store_id}` === url.searchParams.get("store_id"))));
    else res.end("[]");
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  return { server, entries, url: `http://127.0.0.1:${server.address().port}` };
}

test("gateway denies unauthorized clients and chooses real tenant-specific providers", { timeout: 15000 }, async () => {
  const [shared, a, b, gatewayPort] = [await mockRest(), await mockRest(), await mockRest(), await mockRest()];
  await new Promise(resolve => gatewayPort.server.close(resolve));
  const key = "this-is-only-a-test-secret-123456789012345";
  const proc = spawn(process.execPath, [fileURLToPath(new URL("../docker/three-tier/gateway/server.mjs", import.meta.url))], {
    env: { ...process.env, DEMO_GATEWAY_KEY: key, DEMO_GATEWAY_PORT: String(new URL(gatewayPort.url).port), DEMO_SHARED_REST_URL: shared.url, DEMO_ENTERPRISE_A_REST_URL: a.url, DEMO_ENTERPRISE_B_REST_URL: b.url }, stdio: ["ignore", "pipe", "pipe"],
  });
  try {
    await new Promise((resolve, reject) => { const watchdog = setTimeout(() => reject(new Error("gateway did not start")), 7000); proc.stdout.on("data", chunk => { if (chunk.toString().includes("ready")) { clearTimeout(watchdog); resolve(); } }); proc.once("exit", code => reject(new Error(`exited ${code}`))); });
    const base = gatewayPort.url;
    const bad = await fetch(base + "/stores");
    assert.equal(bad.status, 401);
    const request = (path, options={}) => fetch(base+path, { ...options, headers: { "x-demo-gateway-key": key, ...(options.body ? { "Content-Type": "application/json" } : {}) } });
    const regular = await (await request("/stores", { method: "POST", body: JSON.stringify({ name: "Farm Regular", tier: "regular" }) })).json();
    const pro = await (await request("/stores", { method: "POST", body: JSON.stringify({ name: "Farm Pro", tier: "pro" }) })).json();
    const enterprise = await (await request("/stores", { method: "POST", body: JSON.stringify({ name: "Farm Enterprise", tier: "enterprise" }) })).json();
    assert.equal(regular.slot,"shared");
    assert.equal(pro.slot,"pro_a");
    assert.equal(enterprise.slot,"enterprise_a");
    assert.ok(shared.entries.some(e => e.path === "/demo_products" && e.value.store_id === regular.store_id));
    assert.ok(shared.entries.some(e => e.path === "/products" && e.schema === "pro_a" && e.value.store_id === pro.store_id));
    assert.ok(a.entries.some(e => e.path === "/products" && e.value.store_id === enterprise.store_id));
    assert.ok(!b.entries.some(e => e.path === "/products"));
    const products = await (await request(`/stores/${enterprise.store_id}/products`)).json();
    assert.equal(products.products.length, 1);
    assert.equal(products.routing.database, "enterprise_a");
  } finally {
    proc.kill();
    for (const db of [shared,a,b]) await new Promise(resolve=>db.server.close(resolve));
  }
});
