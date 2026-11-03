import { createServer } from "node:http";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { storageForTenant, SLOTS, TIERS } from "../../../packages/tenant-routing/index.mjs";

const KEY = process.env.DEMO_GATEWAY_KEY ?? "";
if (Buffer.byteLength(KEY) < 32) throw new Error("DEMO_GATEWAY_KEY must be >= 32 bytes");
const SOURCES = Object.freeze({
  shared: process.env.DEMO_SHARED_REST_URL ?? "http://shared-rest:3000",
  enterprise_a: process.env.DEMO_ENTERPRISE_A_REST_URL ?? "http://enterprise-a-rest:3000",
  enterprise_b: process.env.DEMO_ENTERPRISE_B_REST_URL ?? "http://enterprise-b-rest:3000",
});
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function authorize(req) {
  const supplied = req.headers["x-demo-gateway-key"];
  if (typeof supplied !== "string") return false;
  const actual = Buffer.from(KEY);
  const received = Buffer.from(supplied);
  return actual.length === received.length && timingSafeEqual(actual, received);
}
async function postgrest(key, path, { method = "GET", body, schema } = {}) {
  const base = SOURCES[key];
  if (!base) throw new Error("Unknown backend");
  const headers = { Accept: "application/json" };
  if (schema) {
    headers["Accept-Profile"] = schema;
    headers["Content-Profile"] = schema;
  }
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    headers.Prefer = "return=representation";
  }
  const response = await fetch(new URL(path, base), {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(7000),
  });
  if (!response.ok) {
    console.error("[demo-postgrest]", key, response.status);
    throw new Error("Demo data provider unavailable");
  }
  return response.status === 204 ? [] : response.json();
}
async function readiness() {
  const checks = await Promise.allSettled(Object.keys(SOURCES).map(async (key) => {
    const endpoint = key === "shared" ? "/demo_stores?select=store_id&limit=1" : "/products?select=product_id&limit=1";
    await postgrest(key, endpoint);
    return key;
  }));
  return checks.every((check) => check.status === "fulfilled");
}
async function catalog() {
  return postgrest("shared", "/demo_stores?select=store_id,name,tier,slot,created_at&order=created_at.asc");
}
function json(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  res.end(JSON.stringify(data));
}
async function getBody(req) {
  let text = "";
  for await (const chunk of req) {
    text += chunk.toString("utf8");
    if (text.length > 8192) throw new Error("Request too large");
  }
  return JSON.parse(text);
}
async function productsForStore(storeId) {
  const rows = await catalog();
  const tenant = rows.find((row) => row.store_id === storeId);
  if (!tenant) return null;
  const routing = storageForTenant(tenant);
  let path;
  let base;
  let schema;
  if (tenant.tier === "regular") {
    base = "shared";
    path = `/demo_products?select=product_id,store_id,name,price&store_id=eq.${storeId}`;
  } else {
    base = routing.database;
    schema = tenant.tier === "pro" ? routing.schema : undefined;
    path = `/products?select=product_id,store_id,name,price&store_id=eq.${storeId}`;
  }
  const products = await postgrest(base, path, { schema });
  return { tenant, routing, products };
}

// Local-only catalog management. The gateway chooses every backend, schema, and store_id;
// callers cannot supply an arbitrary PostgREST target or bypass the store filter.
const ALLOWED = Object.freeze({
  categories: new Set(["name", "description", "image_url"]),
  products: new Set(["name", "description", "unit", "image_url", "status", "nutrition", "price", "category_id"]),
});
async function resolveStore(storeId) {
  const tenant = (await catalog()).find((row) => row.store_id === storeId);
  if (!tenant) return null;
  const routing = storageForTenant(tenant);
  return { tenant, base: tenant.tier === "enterprise" ? routing.database : "shared",
    schema: tenant.tier === "pro" ? routing.schema : undefined };
}
function cleanFields(input, kind, isCreate) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid payload");
  const keys = Object.keys(input);
  if (keys.length === 0 || keys.some((key) => !ALLOWED[kind].has(key))) throw new Error("Invalid payload fields");
  if (isCreate && !Object.hasOwn(input, "name")) throw new Error("Invalid name");
  const result = {};
  for (const [key, value] of Object.entries(input)) {
    if (key === "name" && (typeof value !== "string" || !value.trim() || value.length > 150 || (kind === "categories" && value.length > 100))) throw new Error("Invalid name");
    if (["description", "image_url", "nutrition"].includes(key) && value !== null && (typeof value !== "string" || value.length > 4000)) throw new Error("Invalid text");
    if (key === "unit" && (typeof value !== "string" || !value.trim() || value.length > 20)) throw new Error("Invalid unit");
    if (key === "status" && !["active", "inactive"].includes(value)) throw new Error("Invalid status");
    if (key === "price" && (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 9999999999.99)) throw new Error("Invalid price");
    if (key === "category_id" && value !== null && (typeof value !== "string" || !uuid.test(value))) throw new Error("Invalid category_id");
    result[key] = key === "name" ? value.trim() : value;
  }
  return result;
}
async function manageCatalog(storeId, kind, method, itemId, input) {
  const target = await resolveStore(storeId);
  if (!target) return null;
  const { base, schema } = target;
  const table = kind === "categories" ? "categories" : "products";
  const idColumn = kind === "categories" ? "category_id" : "product_id";
  const scope = `store_id=eq.${storeId}`;
  const path = `/${table}?${scope}${itemId ? `&${idColumn}=eq.${itemId}` : ""}`;
  if (method === "GET") return postgrest(base, `${path}&select=*&limit=100`, { schema });
  if (method === "POST" || method === "PATCH") {
    const fields = cleanFields(input, kind, method === "POST");
    // The composite FK also enforces this in the database, independently of the gateway.
    if (kind === "products" && fields.category_id) {
      const matches = await postgrest(base, `/categories?${scope}&category_id=eq.${fields.category_id}&select=category_id&limit=1`, { schema });
      if (matches.length !== 1) throw new Error("Invalid category_id for store");
    }
    const body = method === "POST" ? { ...fields, store_id: storeId, [idColumn]: randomUUID() } : fields;
    return postgrest(base, method === "POST" ? `/${table}` : path, { schema, method, body });
  }
  if (method === "DELETE") return postgrest(base, path, { schema, method });
  throw new Error("Invalid operation");
}


// Commerce operations use one PostgreSQL RPC each so writes commit/rollback atomically.
// This remains a privileged LOCAL DEMO gateway, not customer-facing production checkout.
async function commerce(storeId, operation, body, orderId) {
  const target = await resolveStore(storeId);
  if (!target) return null;
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid payload');
  const { base, schema } = target;
  let fn, args;
  if (operation === 'restock') {
    if (!uuid.test(body.product_id ?? '') || !Number.isInteger(body.quantity) || body.quantity < 1 || body.quantity > 100000 || Object.keys(body).length !== 2) throw new Error('Invalid restock');
    fn='demo_restock'; args={p_store:storeId,p_product:body.product_id,p_quantity:body.quantity};
  } else if (operation === 'checkout') {
    if (!uuid.test(body.order_id ?? '') || !Array.isArray(body.items) || body.items.length<1 || body.items.length>50 || Object.keys(body).length !== 2 || body.items.some(x=>!x || !uuid.test(x.product_id ?? '') || !Number.isInteger(x.quantity) || x.quantity<1 || x.quantity>1000 || Object.keys(x).length !== 2)) throw new Error('Invalid checkout');
    fn='demo_checkout';args={p_store:storeId,p_order:body.order_id,p_items:body.items};
  } else if (operation === 'cancel') {
    if (!uuid.test(orderId ?? '') || Object.keys(body).length!==0) throw new Error('Invalid cancellation');
    fn='demo_cancel_order';args={p_store:storeId,p_order:orderId};
  } else throw new Error('Invalid operation');
  return postgrest(base, `/rpc/${fn}`, { schema, method:'POST', body:args });
}

// Local-only simulated payment/fulfillment. No actual payment processor or Shipper identity.
async function fulfillment(storeId, orderId, action, body) {
  const target = await resolveStore(storeId);
  if (!target) return null;
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Invalid payload");
  const { base, schema } = target;
  let fn, args;
  if (action === "simulate-payment") {
    if (Object.keys(body).length !== 0) throw new Error("Invalid payment payload");
    fn = "demo_confirm_payment";
    args = {p_store:storeId,p_order:orderId};
  } else if (action === "assign-delivery") {
    if (Object.keys(body).length !== 1 || typeof body.assigned_to !== "string" || !body.assigned_to.trim() || body.assigned_to.length > 120)
      throw new Error("Invalid assignee");
    fn = "demo_assign_delivery";
    args = {p_store:storeId,p_order:orderId,p_assignee:body.assigned_to.trim()};
  } else if (action === "complete-delivery") {
    if (Object.keys(body).length !== 0) throw new Error("Invalid delivery payload");
    fn = "demo_complete_delivery";
    args = {p_store:storeId,p_order:orderId};
  } else throw new Error("Invalid fulfillment action");
  return postgrest(base, `/rpc/${fn}`, {schema,method:"POST",body:args});
}

// Read-only commerce inspection: always scope by tenant from the trusted catalog.
async function inspectCommerce(storeId, resource, orderId) {
  const target = await resolveStore(storeId);
  if (!target) return null;
  const { base, schema } = target;
  const scope = `store_id=eq.${storeId}`;
  if (resource === "inventory") {
    return { items: await postgrest(base, `/inventory_stock?select=store_id,product_id,available,updated_at&${scope}&order=product_id.asc&limit=200`, { schema }) };
  }
  if (resource === "orders" && !orderId) {
    return { items: await postgrest(base, `/commerce_orders?select=order_id,store_id,status,payment_status,total,created_at&${scope}&order=created_at.desc&limit=100`, { schema }) };
  }
  if (resource === "orders" && orderId) {
    const orders = await postgrest(base, `/commerce_orders?select=order_id,store_id,status,payment_status,total,created_at&${scope}&order_id=eq.${orderId}&limit=1`, { schema });
    if (orders.length === 0) return { items: [] };
    const lines = await postgrest(base, `/commerce_order_items?select=product_id,quantity,unit_price&${scope}&order_id=eq.${orderId}&limit=100`, { schema });
    const delivery = await postgrest(base, `/commerce_deliveries?select=assigned_to,status,assigned_at,delivered_at&${scope}&order_id=eq.${orderId}&limit=1`, { schema });
    const events = await postgrest(base, `/commerce_events?select=action,created_at&${scope}&order_id=eq.${orderId}&order=created_at.asc&limit=50`, { schema });
    return { items: [{ ...orders[0], lines, delivery: delivery[0] ?? null, events }] };
  }
  throw new Error("Invalid commerce resource");
}

// Single-process demo allocation guard: not a production distributed provisioning algorithm.
let queue = Promise.resolve();
async function provision(input) {
  if (!input || !TIERS.includes(input.tier) || typeof input.name !== "string") throw new Error("Invalid store input");
  const name = input.name.trim();
  if (name.length < 2 || name.length > 120) throw new Error("Invalid store name");
  const rows = await catalog();
  let slot;
  if (input.tier === "regular") slot = "shared";
  else slot = SLOTS[input.tier].find((candidate) => !rows.some((row) => row.tier === input.tier && row.slot === candidate));
  if (!slot) throw new Error("No pre-provisioned demo slot available for this tier");
  const store_id = randomUUID();
  const product_id = randomUUID();
  const product = { product_id, store_id, name: `Demo starter item - ${name}`, price: 12000 };
  // Write business data first. If the catalog write fails, compensate best-effort.
  const backend = input.tier === "enterprise" ? slot : "shared";
  const schema = input.tier === "pro" ? slot : undefined;
  const table = input.tier === "regular" ? "demo_products" : "products";
  const record = { store_id, name, tier: input.tier, slot };
  if (input.tier === "regular") {
    // FK requires the catalog row first for shared tables.
    await postgrest("shared", "/demo_stores", { method: "POST", body: record });
    try {
      await postgrest("shared", "/demo_products", { method: "POST", body: product });
    } catch (error) {
      await postgrest("shared", `/demo_stores?store_id=eq.${store_id}`, { method: "DELETE" }).catch(() => {});
      throw error;
    }
  } else {
    await postgrest(backend, `/${table}`, { method: "POST", body: product, schema });
    try {
      await postgrest("shared", "/demo_stores", { method: "POST", body: record });
    } catch (error) {
      await postgrest(backend, `/${table}?store_id=eq.${store_id}`, { method: "DELETE", schema }).catch(() => {});
      throw error;
    }
  }
  return { ...record, storage: storageForTenant(record) };
}

createServer(async (req, res) => {
  try {
    const path = new URL(req.url ?? "/", "http://localhost").pathname;
    if (req.method === "GET" && path === "/health") return json(res, 200, { status: "ok", service: "tenant-demo-gateway" });
    if (req.method === "GET" && path === "/ready") {
      const ready = await readiness();
      return json(res, ready ? 200 : 503, { status: ready ? "ready" : "unavailable" });
    }
    if (!authorize(req)) return json(res, 401, { error: "Unauthorized" });
    if (req.method === "GET" && path === "/stores") return json(res, 200, { items: await catalog() });
    const matched = /^\/stores\/([0-9a-f-]{36})\/products$/i.exec(path);
    if (req.method === "GET" && matched && uuid.test(matched[1])) {
      const result = await productsForStore(matched[1]);
      return result ? json(res, 200, result) : json(res, 404, { error: "Store not found" });
    }
    const catalogMatch = /^\/stores\/([0-9a-f-]{36})\/(categories|catalog-products)(?:\/([0-9a-f-]{36}))?$/i.exec(path);
    if (catalogMatch && uuid.test(catalogMatch[1]) && (!catalogMatch[3] || uuid.test(catalogMatch[3]))) {
      const [, storeId, routeKind, itemId] = catalogMatch;
      const kind = routeKind === "catalog-products" ? "products" : "categories";
      if (["GET", "POST", "PATCH", "DELETE"].includes(req.method) &&
          ((req.method === "POST" && !itemId) || (req.method !== "POST" && (req.method === "GET" || !!itemId)))) {
        const body = ["POST", "PATCH"].includes(req.method) ? await getBody(req) : undefined;
        const result = await manageCatalog(storeId, kind, req.method, itemId, body);
        return result === null ? json(res, 404, { error: "Store not found" }) : json(res, req.method === "POST" ? 201 : 200, { items: result });
      }
    }
    const readMatch = /^\/stores\/([0-9a-f-]{36})\/(inventory|orders)(?:\/([0-9a-f-]{36}))?$/i.exec(path);
    if (req.method === "GET" && readMatch && uuid.test(readMatch[1]) && (!readMatch[3] || uuid.test(readMatch[3])) && (readMatch[2] === "orders" || !readMatch[3])) {
      const result = await inspectCommerce(readMatch[1], readMatch[2], readMatch[3]);
      return result === null ? json(res, 404, { error: "Store not found" }) : json(res, 200, result);
    }
    const fulfillmentMatch = /^\/stores\/([0-9a-f-]{36})\/orders\/([0-9a-f-]{36})\/(simulate-payment|assign-delivery|complete-delivery)$/i.exec(path);
    if (req.method === "POST" && fulfillmentMatch && uuid.test(fulfillmentMatch[1]) && uuid.test(fulfillmentMatch[2])) {
      const result = await fulfillment(fulfillmentMatch[1], fulfillmentMatch[2], fulfillmentMatch[3], await getBody(req));
      return result === null ? json(res,404,{error:"Store not found"}) : json(res,200,result);
    }
    const actionMatch = /^\/stores\/([0-9a-f-]{36})\/(restock|checkout|orders\/([0-9a-f-]{36})\/cancel)$/i.exec(path);
    if (req.method === 'POST' && actionMatch && uuid.test(actionMatch[1]) && (!actionMatch[3] || uuid.test(actionMatch[3]))) {
      const operation = actionMatch[2] === 'restock' ? 'restock' : actionMatch[2] === 'checkout' ? 'checkout' : 'cancel';
      const result = await commerce(actionMatch[1],operation,await getBody(req),actionMatch[3]);
      return result === null ? json(res,404,{error:'Store not found'}) : json(res,200,result);
    }
    if (req.method === "POST" && path === "/stores") {
      const body = await getBody(req);
      const current = queue.then(() => provision(body));
      queue = current.catch(() => {});
      return json(res, 201, await current);
    }
    return json(res, 404, { error: "Not found" });
  } catch (error) {
    console.error("[tenant-demo]", error instanceof Error ? error.message : "Unknown error");
    const message = error instanceof Error ? error.message : "Unexpected failure";
    const clientError = /^(Invalid|No pre-provisioned|Request too large)/.test(message);
    json(res, clientError ? 422 : 503, { error: clientError ? message : "Demo data service unavailable" });
  }
}).listen(Number(process.env.DEMO_GATEWAY_PORT ?? 4100), "0.0.0.0", () => console.log("tenant demo gateway ready"));
