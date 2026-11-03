/** Minimal common CRUD contract for a gradual Product/Category migration. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TABLES = Object.freeze({
  products: Object.freeze({
    id: "product_id",
    select: "product_id,store_id,category_id,name,description,unit,image_url,status,created_at,nutrition,categories(name)",
    order: "created_at.desc",
  }),
  categories: Object.freeze({
    id: "category_id",
    select: "category_id,store_id,name,description,image_url,created_at",
    order: "name.asc",
  }),
});

export class TenantDataError extends Error {
  constructor(message) {
    super(message);
    this.name = "TenantDataError";
  }
}

function tableConfig(table) {
  if (!Object.hasOwn(TABLES, table)) throw new TenantDataError("Unsupported data collection");
  return TABLES[table];
}
function assertId(id) {
  if (typeof id !== "string" || !UUID.test(id)) throw new TenantDataError("Invalid record identifier");
}
function payloadRow(record, storeId, inserting) {
  if (!record || typeof record !== "object" || Array.isArray(record))
    throw new TenantDataError("Invalid tenant write payload");
  if (Object.hasOwn(record, "store_id") && (record.store_id !== storeId || !inserting))
    throw new TenantDataError("Tenant ownership cannot be changed");
  if (!inserting && Object.keys(record).length === 0)
    throw new TenantDataError("Empty tenant update");
  return inserting ? { ...record, store_id: storeId } : { ...record };
}

/**
 * A target must already have been resolved from the trusted catalog.
 * Credentials must be supplied only by server code (never browser headers).
 * Any missing target, transport failure or non-2xx response fails closed.
 */
export function createTenantPostgrestAdapter({ route, headers, fetchImpl = fetch }) {
  if (!route || !UUID.test(route.storeId ?? "") || !route.url || !route.schema ||
      !["supabase", "postgrest"].includes(route.kind))
    throw new TenantDataError("Unresolved tenant data route");
  if (!headers || typeof headers !== "object" || !Object.keys(headers).length)
    throw new TenantDataError("Missing server-side data credentials");
  const base = new URL(route.url);
  if (base.search || base.hash || base.username || base.password ||
      !["http:", "https:"].includes(base.protocol))
    throw new TenantDataError("Unsafe tenant data endpoint");
  const baseHeaders = new Headers(headers);
  if (!baseHeaders.has("Authorization") && !baseHeaders.has("apikey"))
    throw new TenantDataError("Missing data authorization");

  async function execute(table, method, params, body) {
    tableConfig(table);
    const url = new URL(`${table}`, base.href.endsWith("/") ? base : new URL(`${base.pathname}/`, base));
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    // Inserts carry the server-derived store_id in the JSON body; other
    // operations also constrain the target rows in PostgREST.
    if (method !== "POST") url.searchParams.set("store_id", `eq.${route.storeId}`);
    const requestHeaders = new Headers(baseHeaders);
    requestHeaders.set("Accept", "application/json");
    requestHeaders.set("Accept-Profile", route.schema);
    requestHeaders.set("Content-Profile", route.schema);
    if (body !== undefined) requestHeaders.set("Content-Type", "application/json");
    if (["POST", "PATCH", "DELETE"].includes(method))
      requestHeaders.set("Prefer", "return=representation");
    let response;
    try {
      response = await fetchImpl(url, {
        method, headers: requestHeaders, body: body === undefined ? undefined : JSON.stringify(body),
        redirect: "error", cache: "no-store", signal: AbortSignal.timeout(8000),
      });
    } catch {
      throw new TenantDataError("Tenant data transport unavailable");
    }
    if (!response.ok) throw new TenantDataError(`Tenant data operation failed (${response.status})`);
    if (response.status === 204) return [];
    try {
      const rows = await response.json();
      if (!Array.isArray(rows) || rows.some((row) => !row || row.store_id !== route.storeId))
        throw new Error("Unexpected or cross-tenant result");
      return rows;
    } catch {
      throw new TenantDataError("Unexpected tenant data response");
    }
  }
  function idQuery(table, id) {
    const config = tableConfig(table);
    assertId(id);
    return { [config.id]: `eq.${id}`, select: config.select };
  }
  return Object.freeze({
    async list(table, options = {}) {
      const config = tableConfig(table);
      const limit = options.limit ?? 100;
      const offset = options.offset ?? 0;
      if (!Number.isInteger(limit) || limit < 1 || limit > 500 ||
          !Number.isInteger(offset) || offset < 0 || offset > 1_000_000)
        throw new TenantDataError("Invalid pagination");
      return execute(table, "GET", {
        select: config.select, order: config.order, limit: String(limit), offset: String(offset),
      });
    },
    async find(table, id) {
      const rows = await execute(table, "GET", { ...idQuery(table, id), limit: "1" });
      return rows[0] ?? null;
    },
    async insert(table, record) {
      const config = tableConfig(table);
      const rows = await execute(table, "POST", { select: config.select }, payloadRow(record, route.storeId, true));
      if (rows.length !== 1) throw new TenantDataError("Unexpected tenant insert response");
      return rows[0];
    },
    async update(table, id, record) {
      const rows = await execute(table, "PATCH", idQuery(table, id), payloadRow(record, route.storeId, false));
      return rows[0] ?? null;
    },
    async delete(table, id) {
      const rows = await execute(table, "DELETE", idQuery(table, id));
      return rows.length !== 0;
    },
  });
}
