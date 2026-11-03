# GreenPlus — Docker 3-tier sandbox (separate from production)

This is an **actual Docker/PostgreSQL data isolation experiment within the GreenPlus repository**, exposed to the **existing Web Admin** through a dedicated admin-only sandbox screen. It does **not** replace or migrate the production product/order/checkout APIs. Online Supabase remains unchanged by these files.

## Local setup

1. Install Docker Desktop, Node.js/npm and Git. Start Docker Desktop.
2. In `docker/three-tier`, copy `.env.example` to `.env`. Set a strong local password using URL-safe characters and a randomly generated gateway key of at least 32 characters. The gateway publishes _only_ on `127.0.0.1:4100`, and PostgREST/PostgreSQL are internal to Docker.
3. Run `docker compose config -q`, then `docker compose up -d --build` and `docker compose ps`.
4. Verify `curl http://127.0.0.1:4100/health` (PowerShell: `Invoke-RestMethod http://127.0.0.1:4100/health`).
5. In the root of the actual GreenPlus checkout, configure **only the local Admin process**, e.g. `web-admin/.env.local`, with the values below. The existing root `.env` may still provide your regular Admin authentication; don't paste public/production Supabase keys into Docker files.

```dotenv
GREENPLUS_TENANCY_DEMO=true
NEXT_PUBLIC_GREENPLUS_TENANCY_DEMO=true
GREENPLUS_DOCKER_GATEWAY_URL=http://127.0.0.1:4100
GREENPLUS_DOCKER_GATEWAY_KEY=<copy-secret-from-docker/three-tier/.env>
```

6. Run `npm install` / `npm ci` from the root (after merging lockfile changes), `npm run dev:admin`, sign in as an existing **Admin**, then visit `http://localhost:3001/settings/stores` and select **Docker 3-tier demo**. You may also navigate to `/settings/tenant-demo`.

## Isolation

- Regular: two seeded stores share `shared-db.public.demo_products`, separated by `store_id`.
- Pro: new tenants occupy the pre-created `pro_a.products` or `pro_b.products` schemas, in `shared-db`.
- Enterprise: new tenants occupy the independent `enterprise-a-db` and `enterprise-b-db` PostgreSQL containers (separate volumes).
- All tier destination names come from a fixed allowlist. The browser cannot specify a schema or database hostname.
- The Admin route requires existing Admin authentication and `GREENPLUS_TENANCY_DEMO=true`. It only accepts loopback Docker endpoints. The gateway requires `x-demo-gateway-key` and has no public database ports.

Try creating a Regular, Pro and Enterprise tenant. This demo uses a bounded pool of two Pro schema slots and two Enterprise database slots. A production allocator would provision databases/schemas dynamically and transactionally.

```powershell
$h = @{ 'x-demo-gateway-key' = '<your-demo-gateway-key>' }
Invoke-RestMethod 'http://127.0.0.1:4100/stores' -Headers $h
# After creating a tenant, copy its store_id from the Admin demo page:
Invoke-RestMethod 'http://127.0.0.1:4100/stores/<store-uuid>/products' -Headers $h
```

To stop without destroying named volumes: `docker compose down`. **Do not use `down -v` unless intentionally resetting the demo.** Changes to SQL initialization scripts are applied only to fresh databases and require explicit migration thereafter.

**Caution:** This design's PostgREST backends use demonstration-only privileges and lack production-grade user identity, tenant-specific roles, provisioning transactions, read/write feature coverage and deployment topology. Do not publish the gateway on the public internet or point Vercel at a laptop. This is not a replacement for existing checkout/payment/order behavior.

## Commerce-compatible Product/Category slice (SQL 002)

`sql/shared/002_product_category_slice.sql` and matching Enterprise scripts add the **minimal Product/Category columns expected by the Phase 1 PostgREST adapter**. Regular uses `public.products` and `public.categories`; Pro uses the same table names inside `pro_a` or `pro_b`; Enterprise uses the same tables in each dedicated database. `demo_products` and legacy `products.price` remain for the existing demo gateway. No Supabase migration is created or run.

For **fresh** Docker data volumes, initdb applies SQL `001` and `002` in filename order. For **existing named volumes**, PostgreSQL does *not* rerun initialization scripts. First back up the sandbox volumes, start the containers, then apply `002` explicitly from `docker/three-tier`:

```powershell
# Run after a backup, in docker/three-tier
# No 'down -v' is needed; SQL 002 uses a transaction and is repeatable.
docker compose exec -T shared-db psql -X -v ON_ERROR_STOP=1 -U postgres -d greenplus_demo -f /docker-entrypoint-initdb.d/002_product_category_slice.sql
docker compose exec -T enterprise-a-db psql -X -v ON_ERROR_STOP=1 -U postgres -d enterprise_a -f /docker-entrypoint-initdb.d/002_product_category_slice.sql
docker compose exec -T enterprise-b-db psql -X -v ON_ERROR_STOP=1 -U postgres -d enterprise_b -f /docker-entrypoint-initdb.d/002_product_category_slice.sql
docker compose restart shared-rest enterprise-a-rest enterprise-b-rest
```

From the repository root, use `npm run test:three-tier-commerce` for the **static contract** (no database) and `npm run test:three-tier-commerce:docker` for the **live disposable SQL probes**. The live probe runs one transaction per schema/database and ends it with `ROLLBACK`. It verifies scoped queries and that a product cannot reference another store's category; it does not certify database RLS or JWT-role isolation.

**Not a production cutover:** Docker PostgREST still runs behind the separate demonstration gateway with demo-only privileges, not tenant-authenticated PostgreSQL roles. Existing `0015` registry entries, production PostgREST authentication, row-level security, tenant-specific credential permissions, migration parity for orders/inventory, and live cross-tenant checks are prerequisites before setting `GREENPLUS_TENANT_DATA_READ_PRODUCTS=true`. Do **not** point the Admin adapter at the demo PostgREST services or expose those services publicly merely because SQL `002` exists.
