# GreenPlus v2.0 Multi-Tenant Implementation Report

### 1. Complete list of changed files

The task-related files below are based on the current Git working tree, the implementation changes made in this session, and the untracked Phase A migration files. No task-related file was deleted.

#### Added

- [`web-client/backend/core/store-context.ts`](../web-client/backend/core/store-context.ts) — Adds the server-only `resolveStoreContext` resolver. It validates UUIDs, verifies active stores, preserves the legacy single-active-store fallback, and requires an explicit store when more than one active store exists.
- [`docs/MULTITENANT_IMPLEMENTATION_REPORT.md`](./MULTITENANT_IMPLEMENTATION_REPORT.md) — Records the verified file inventory, implementation status, migration findings, executed commands, deployment procedure, and readiness verdict.
- [`supabase/migrations/0004_create_tenant_core.sql`](../supabase/migrations/0004_create_tenant_core.sql) — Adds store memberships, store settings, explicit platform administrators, audit logs, and user devices, while retaining the custom `public.users.user_id` identity model.
- [`supabase/migrations/0005_add_store_scope.sql`](../supabase/migrations/0005_add_store_scope.sql) — Adds nullable `store_id` columns to the listed tenant-owned business tables.
- [`supabase/migrations/0006_backfill_existing_store.sql`](../supabase/migrations/0006_backfill_existing_store.sql) — Backfills legacy rows only when exactly one store exists and aborts otherwise.
- [`supabase/migrations/0007_add_nullable_store_fks.sql`](../supabase/migrations/0007_add_nullable_store_fks.sql) — Adds indexes and nullable `store_id` foreign keys as `NOT VALID` constraints.
- [`supabase/migrations/0008_protect_new_tenant_tables.sql`](../supabase/migrations/0008_protect_new_tenant_tables.sql) — Enables RLS and revokes `anon`/`authenticated` access on the new private tenant tables without changing legacy browser policies.
- [`supabase/migrations/0009_features_v2.sql`](../supabase/migrations/0009_features_v2.sql) — Adds inventory alerts, promotion suggestions, and promotions with store references and feature-level constraints.
- [`supabase/migrations/0010_transition_diagnostics.sql`](../supabase/migrations/0010_transition_diagnostics.sql) — Checks the single-store assumption and settings completeness, and reports remaining NULL `store_id` rows.

#### Modified

- [`web-client/backend/modules/products/product.repository.ts`](../web-client/backend/modules/products/product.repository.ts) — Adds store filters to product, batch, supplier, inventory relation, and price lookups.
- [`web-client/backend/modules/products/product.service.ts`](../web-client/backend/modules/products/product.service.ts) — Passes the resolved store through product browsing and all secondary catalog lookups.
- [`web-client/backend/modules/products/search.service.ts`](../web-client/backend/modules/products/search.service.ts) — Requires a store context for search.
- [`web-client/backend/modules/products/product-detail.service.ts`](../web-client/backend/modules/products/product-detail.service.ts) — Requires the store context for detail, batch, inventory, supplier, and price reads.
- [`web-client/backend/modules/products/facades/product.facade.ts`](../web-client/backend/modules/products/facades/product.facade.ts) — Extends the facade API to carry `storeId`.
- [`web-client/src/app/api/products/route.ts`](../web-client/src/app/api/products/route.ts) — Resolves `storeId` for browse/search requests and passes it to the facade.
- [`web-client/src/app/api/products/[productId]/route.ts`](../web-client/src/app/api/products/[productId]/route.ts) — Resolves `storeId` and validates product detail within that store.
- [`web-client/backend/modules/cart/cart.repository.ts`](../web-client/backend/modules/cart/cart.repository.ts) — Makes cart lookup/creation and catalog, batch, inventory, and price reads store-aware; populates `store_id` on cart-item inserts.
- [`web-client/backend/modules/cart/cart.service.ts`](../web-client/backend/modules/cart/cart.service.ts) — Threads `storeId` through cart creation, reads, stock validation, mutations, and note operations.
- [`web-client/backend/modules/cart/facades/cart.facade.ts`](../web-client/backend/modules/cart/facades/cart.facade.ts) — Extends cart facade methods with `storeId`.
- [`web-client/backend/modules/orders/order.types.ts`](../web-client/backend/modules/orders/order.types.ts) — Adds `storeId` to customer order inputs.
- [`web-client/backend/modules/orders/order.repository.ts`](../web-client/backend/modules/orders/order.repository.ts) — Scopes order-history, payment, delivery, cart, item, price, batch, inventory, and order-state operations; adds the checkout RPC client.
- [`web-client/backend/modules/orders/order.service.ts`](../web-client/backend/modules/orders/order.service.ts) — Carries store scope through order history, detail, cancellation, payment confirmation, updates, and atomic checkout, including the idempotency key passed to the RPC.
- [`web-client/backend/modules/orders/facades/order.facade.ts`](../web-client/backend/modules/orders/facades/order.facade.ts) — Extends order facade methods with `storeId`.
- [`web-client/src/app/api/cart/route.ts`](../web-client/src/app/api/cart/route.ts) — Resolves and passes store context for cart reads and item mutations.
- [`web-client/src/app/api/cart/note/route.ts`](../web-client/src/app/api/cart/note/route.ts) — Resolves and passes store context for cart-note updates.
- [`web-client/src/app/api/orders/route.ts`](../web-client/src/app/api/orders/route.ts) — Resolves store context for order history and checkout.
- [`web-client/src/app/api/orders/[orderId]/route.ts`](../web-client/src/app/api/orders/[orderId]/route.ts) — Restricts order detail and updates to the selected store.
- [`web-client/src/app/api/orders/[orderId]/cancel/route.ts`](../web-client/src/app/api/orders/[orderId]/cancel/route.ts) — Passes verified store context to cancellation.
- [`web-client/src/app/api/orders/[orderId]/confirm-payment/route.ts`](../web-client/src/app/api/orders/[orderId]/confirm-payment/route.ts) — Passes verified store context to payment confirmation.
- [`web-client/src/app/api/payments/route.ts`](../web-client/src/app/api/payments/route.ts) — Scopes payment history by store.
- [`web-client/backend/core/tenant-authorization.ts`](../web-client/backend/core/tenant-authorization.ts) — Adds reusable custom-auth store membership, role, permission, and platform-admin checks.
- [`web-admin/backend/core/authorization.ts`](../web-admin/backend/core/authorization.ts) — Adds store-membership-aware admin permission validation.

#### Added outside active migrations

- [`after_app_deployment/0011_enforce_after_code_deployment.sql`](../after_app_deployment/0011_enforce_after_code_deployment.sql) — A template-only restricted checkout RPC with advisory locking, store validation, stock reservation, payment/order creation, idempotency, and cart clearing. It is intentionally not in `supabase/migrations/`.

#### Modified outside active migrations

- [`after_app_deployment/0011_enforce_after_code_deployment.sql`](../after_app_deployment/0011_enforce_after_code_deployment.sql) — The local rehearsal exposed duplicate carts for one user/store in the backup. The RPC now selects the most recently updated non-empty cart instead of selecting an arbitrary cart.

#### Deleted

- None.

The working tree also contains unrelated pre-existing changes and untracked material, including [`web-shipper/next-env.d.ts`](../web-shipper/next-env.d.ts) and [`backups/`](../backups/). Those are not attributed to this implementation report.

### 2. Summary of implemented behavior

#### Completed

- **Store Context:** Server-side store resolution is implemented for product and cart routes. Requested stores must be active and use a valid UUID. Legacy behavior is retained only while exactly one active store exists.
- **Authentication:** Existing custom `gpc1` HMAC authentication remains in use through `requireCustomerIdentity`. Cart routes continue to compare optional request user IDs with the signed cookie identity through `assertCustomerId`. No `auth.uid()` mapping was introduced.
- **Products/catalog:** Browse, search, product detail, batch, inventory relation, supplier, and price reads now carry the selected store and filter by `store_id`.
- **Carts:** Cart lookup and creation are scoped to `(user_id, store_id)`. Cart-item inserts include `store_id`; stock, batch, inventory, product, price, read, update, delete, and note flows receive the selected store context.
- **Database Phase A:** The replacement migration files `0004` through `0010` are present locally, while existing `0001` through `0003` were not modified.

#### Partially completed

- **Orders and checkout:** Customer order history, detail, cancellation, payment confirmation, updates, and payment history now carry store scope and continue to require the verified `gpc1` identity. The restricted RPC was installed and exercised in the isolated local database. It passed successful checkout, duplicate idempotency, invalid store, invalid cart, insufficient-stock rollback, concurrent stock reservation, and duplicate-cart tests. The function remains outside the active migration directory.
- **Inventory:** Product detail and cart stock reads are store-filtered, but inventory CRUD, stock changes, and inventory transaction writes in the broader application were not migrated comprehensively.
- **Authentication and authorization:** Customer identity checks and reusable store-membership/role/platform-admin helpers are present. They are not yet wired across every Admin, Manager, Employee, and Shipper route, and shipper assignment enforcement remains incomplete.
- **Other business modules:** Categories, suppliers, reviews, complaints, subscriptions, group purchases, blogs/posts, loyalty, traceability, delivery, and payment modules were not fully scoped and tested end-to-end.

#### Unimplemented

- Store onboarding and bootstrap procedure in application code.
- Complete Admin, Manager, Employee, and Shipper store authorization.
- Cross-store composite enforcement and final `NOT NULL` enforcement.
- Promotion and execution of the checkout RPC template after staging validation.
- Two-store integration coverage, concurrency coverage, failed-payment rollback coverage, and PostgREST relationship verification.
- Final Phase B enforcement migration is not prepared or present in the active migration directory. The existing `after_app_deployment/0011_enforce_after_code_deployment.sql` is only a checkout-RPC template, not a complete enforcement migration.

### 3. Database migration compatibility results

#### Existing schema compatibility

- [`0003_align_runtime_status_constraints.sql`](../supabase/migrations/0003_align_runtime_status_constraints.sql) is present and unchanged. It expands the batches and payments status checks used by the application.
- The Phase A migrations target the existing GreenPlus v1 tables and use additive `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements for the scoped business tables.
- `0004` assumes the existing `stores`, `users`, and `roles` tables and the existing role flags/columns. It seeds settings and memberships from existing store managers and staff.
- `0006` deliberately aborts unless exactly one store exists. This is compatible with the stated original one-store rehearsal assumption, but it is not a general multi-store backfill.

#### Columns, foreign keys, and constraints

- `0005` adds nullable `store_id` columns to suppliers, categories, products, batches, inventory, inventory transactions, prices, carts, cart items, orders, order items, payments, deliveries, reviews, complaints, subscriptions, posts, post interactions, post media, group buys, and group-buy members.
- `0007` adds indexes and nullable foreign keys from those columns to `stores(store_id)` using `NOT VALID`. It does not enforce non-null values or parent/child same-store consistency.
- `0009` adds feature tables with store foreign keys, but the product and batch foreign keys are individual foreign keys. They do not prove that the referenced product or batch belongs to the same store as the feature row.
- `0008` protects only the newly introduced private tenant tables. Legacy RLS policies remain unchanged by design.
- The proposed staging SQL is present outside the active directory at [`after_app_deployment/0011_enforce_after_code_deployment.sql`](../after_app_deployment/0011_enforce_after_code_deployment.sql). It contains the checkout RPC and idempotency table, but it does not contain final non-null constraints, same-store composite foreign keys, or a complete enforcement migration.

#### Potential breaking changes

- `0006` fails on zero or multiple stores and stops the migration transaction.
- `0008` revokes direct `anon` and `authenticated` access to new private tables. Any browser code that directly accesses those tables would break; the current code review did not prove that every browser usage has been audited.
- After a second active store is created, product and cart requests without `storeId` will fail rather than silently select a store.
- Existing application writes outside the modified product/cart paths can still create NULL `store_id` rows during Phase A.
- Service-role database access bypasses RLS, so application filtering and authorization remain mandatory.
- PostgREST embedded joins may become ambiguous after future composite foreign keys; staging verification with explicit relationship hints is required.

#### Execution and readiness results

- Migration SQL was inspected locally.
- **FAIL/EXPECTED PRECONDITION** — `npx supabase db reset --local` from an empty database stopped at `0006` with `Safe backfill requires exactly one existing store; found 0`. This is consistent with `0006`'s documented requirement and proves a baseline data load is required before `0006`.
- **PASS** — Local reset applied `0001` through `0005`; the untouched backup data was then loaded into the local database using a temporary compatibility stream. The original backup was not modified. The stream loaded the public GreenPlus data before stopping at an unrelated storage permission row; public data required for this rehearsal was present.
- **PASS** — `0006` through `0010` were applied directly to the isolated local database. `0006` backfilled 21 tenant-owned tables, `0007` created 21 indexes and `NOT VALID` foreign keys, `0008` enabled RLS/revoked browser roles on five private tables, `0009` created the three feature tables, and `0010` completed with its Phase A notice.
- **PASS** — Verification found all 21 tenant-owned tables have `store_id`, all 21 corresponding indexes exist, all 21 backfilled tables have zero NULL `store_id` rows, and 29 store foreign keys are present. The Phase A business-table constraints remain unvalidated by design.
- **PASS** — The checkout template installed locally with the expected seven-argument signature and privileges: `service_role` execute is true; `anon` and `authenticated` execute are false.
- These results establish a reproducible isolated local rehearsal, but do not prove production compatibility. A staging clone and remote migration-history comparison remain required.

#### Application behavior by phase

- **Before `0004`–`0010`:** The modified application expects `stores.status`, tenant columns, and store-scoped data. It is not safe to deploy the modified application against a database that lacks the required migration columns.
- **After `0004`–`0010`:** Product and cart paths can use the Phase A schema, subject to the single-store fallback and the remaining unscoped modules.
- **After Phase B/`0011`:** The checkout function was validated only in the isolated local database. The template is not a complete final enforcement migration and has not been executed against staging.

### 4. Tests executed, with pass/fail results

- **PASS** — `npm run typecheck` — TypeScript checks passed for `web-admin`, `web-client`, and `web-shipper`.
- **PASS** — `npm run lint -w web-client -- backend/modules/orders/order.repository.ts backend/modules/orders/order.service.ts backend/modules/orders/order.types.ts src/app/api/orders/route.ts` — Targeted lint completed with exit code 0.
- **PASS** — `npm exec -w web-client -- eslint backend/core/store-context.ts backend/modules/products/product.repository.ts backend/modules/products/product.service.ts backend/modules/products/search.service.ts backend/modules/products/product-detail.service.ts backend/modules/products/facades/product.facade.ts backend/modules/cart/cart.repository.ts backend/modules/cart/cart.service.ts backend/modules/cart/facades/cart.facade.ts src/app/api/products/route.ts 'src/app/api/products/[productId]/route.ts' src/app/api/cart/route.ts src/app/api/cart/note/route.ts` — Targeted lint completed without errors or warnings after cleanup.
- **PASS** — `git diff --check` — No whitespace errors were reported.
- **PASS** — `npm run lint -w web-client` — Full web-client lint completed with exit code 0; existing warnings were reported but no lint errors.
- **PASS** — `npm run build -w web-client` — Next.js production build completed, including TypeScript and static generation.
- **PASS** — Local reset through `0005`, baseline data load, and direct local application of `0006`–`0010` — Phase A schema rehearsal completed after loading the required one-store baseline.
- **PASS** — Local tenant schema verification SQL — 21/21 `store_id` columns, 21/21 indexes, zero NULL rows across all 21 tenant-owned tables, store membership initialization, and private-table RLS were verified.
- **PASS** — Local checkout RPC privilege/signature verification — `service_role` executable; `anon` and `authenticated` denied; seven parameters matched the TypeScript caller.
- **PASS** — Local checkout success and duplicate idempotency tests — the duplicate request returned the original order ID without a second request/order.
- **PASS** — Local invalid store and invalid cart tests — both rejected; the invalid store was rejected by the store foreign key and the invalid cart returned `cart not found`.
- **PASS** — Local insufficient-stock rollback — rejected with `insufficient stock`; no order or idempotency row was committed, the cart item remained, and inventory remained unchanged.
- **PASS** — Local concurrent purchase test — one checkout succeeded, the competing checkout rejected for insufficient stock, one reservation was recorded, and one cart item remained.
- **PASS** — Local duplicate-cart test — a populated cart was selected instead of an arbitrary empty cart for the same user/store.
- **PASS** — Local catalog/cart/order/payment smoke SQL — 95 active store products, 4 scoped carts, 33 scoped orders, 29 scoped payments, zero broken order-item store links, and 3 active store memberships were observed.
- **FAIL/EXPECTED ENVIRONMENT ISSUE** — The original backup data stream eventually reached a storage table and received `permission denied for table buckets_vectors`; all relevant public GreenPlus data had already loaded. Storage rows were excluded from the application rehearsal.
- **NOT RUN** — Unit tests. No repository test runner or test files covering this change were identified.
- **NOT RUN** — Failed-payment integration tests through the application route; the local RPC creates a pending payment and no payment-provider failure callback was exercised.
- **NOT RUN** — Store A/Store B isolation tests; the local backup contains only one store.
- **NOT RUN** — Full Next.js route integration tests and PostgREST embedded-join tests.

### 5. Unresolved issues

- **CRITICAL** — The checkout RPC template has not been promoted or executed in staging. Until then, the application’s checkout endpoint depends on an unavailable database function in staging/production.
- **CRITICAL** — Final `0011` same-store composite constraints and non-null enforcement are still absent.
- **CRITICAL** — Phase B enforcement is absent. `store_id` remains nullable and same-store parent/child consistency is not enforced.
- **HIGH** — Staff authorization does not yet verify active `store_members`, role permissions, platform-admin membership, or shipper store assignment.
- **HIGH** — Other tenant-owned modules have not been comprehensively migrated for store-filtered reads and writes.
- **HIGH** — No staging or production-like database has executed migrations `0003` through `0010` or the checkout RPC template; local compatibility is proven, but remote-schema compatibility remains unproven.
- **HIGH** — No two-store isolation suite or application-route checkout suite has been executed.
- **MEDIUM** — The store resolver only checks that a requested store is active; shopper/store eligibility policy and staff membership authorization are not yet integrated into route authorization.
- **MEDIUM** — Legacy browser RLS dependencies were not fully audited. New private tables are inaccessible to `anon` and `authenticated` by design.
- **MEDIUM** — `0009` feature-table product/batch foreign keys do not enforce same-store ownership.

### 6. Exact manual deployment steps

1. **Confirm scope and branch.** Work from a reviewed branch containing the Phase A migrations and application changes. Do not add a second copy of migration versions `0004` through `0010`. Confirm `0001`, `0002`, and `0003` are the files intended for the target project.

2. **Verify local prerequisites.** From the repository root, confirm Node.js, npm, and the Supabase CLI are available:

   ```powershell
   node --version
   npm --version
   npx supabase --version
   ```

3. **Run application checks before touching the database:**

   ```powershell
   npm run typecheck
   npm exec -w web-client -- eslint backend/core/store-context.ts backend/modules/products/product.repository.ts backend/modules/products/product.service.ts backend/modules/products/search.service.ts backend/modules/products/product-detail.service.ts backend/modules/products/facades/product.facade.ts backend/modules/cart/cart.repository.ts backend/modules/cart/cart.service.ts backend/modules/cart/facades/cart.facade.ts src/app/api/products/route.ts 'src/app/api/products/[productId]/route.ts' src/app/api/cart/route.ts src/app/api/cart/note/route.ts
   npm run build -w web-client
   ```

4. **Back up the live Supabase database before any push.** Use the Supabase dashboard backup/export facility or the approved organization backup process. Store the backup in the approved private location. Do not put credentials or full dumps in Git. Verify that the backup completed and that a restore can be performed in an isolated project; do not assume that a backup record alone is restorable.

5. **Create a staging clone.** Restore the backup into a non-production Supabase project with representative data. Keep the project URL and credentials in the deployment secret manager only.

6. **Compare migration history locally and remotely.** In the target project context, run:

   ```powershell
   npx supabase migration list
   ```

   Confirm the remote history and local files agree that `0001` and `0002` are applied, `0003` is pending, and the replacement `0004` through `0010` are the intended pending files. Do not delete or rename a migration that is applied in any environment.

7. **Rehearse against staging.** After linking only to the staging project, run:

   ```powershell
   npx supabase db push --dry-run
   npx supabase db push
   npx supabase migration list
   ```

   Treat `--dry-run` as a name/list preview only. Review SQL execution output, confirm `0003` through `0010` actually apply, and query staging for NULL scoped rows, foreign-key validity, settings rows, and RLS/revoke behavior. Never use `npx supabase db reset --linked` against production.

8. **Run staging application verification.** Deploy the application to staging only after the Phase A migrations succeed. Verify the existing single-store login, catalog, product detail, cart reads/writes, and checkout behavior. Verify that a requested inactive/nonexistent store is rejected and that catalog secondary reads cannot return another store’s price, batch, supplier, or inventory.

9. **Do not create Store B yet.** Before adding another active store, complete order/checkout scoping, staff authorization, all tenant-owned CRUD paths, and two-store tests. The current code is not ready for a second-store production rollout.

10. **Deploy application and migrations in a coordinated order.** For the current partial implementation, deploy the compatible Phase A schema first in staging, then deploy the application version that expects the new columns. For production, use a maintenance/feature-flag strategy approved by the team so old writers cannot continue indefinitely without `store_id`. Do not claim isolation until all writes are scoped and verified.

11. **Production preflight.** Re-run:

```powershell
npx supabase migration list
```

Confirm the backup and restore verification, the staging result, the exact migration history, and the application artifact/configuration are approved. Verify `SUPABASE_SERVICE_ROLE_KEY` is server-only and is not exposed through `NEXT_PUBLIC_*`.

12. **Production migration command.** Only after explicit approval and backup confirmation, run:

```powershell
npx supabase db push
npx supabase migration list
```

Do not run `npx supabase db reset --linked` in production. Do not execute these production commands as part of this report.

13. **Post-deployment smoke tests.** Using non-sensitive test accounts and the approved active store, verify:

- custom `gpc1` login and authenticated customer identity;
- product browse, search, detail, category, price, supplier, batch, and inventory display;
- cart creation, cart isolation by store, item add/update/delete, and notes;
- existing order history and payment-history reads;
- privileged routes reject unauthorized users;
- new private tenant tables are not directly readable by unauthenticated/browser roles;
- application logs show no unexpected NULL `store_id` writes.

14. **Rollback and recovery.** Do not roll back by deleting applied migration files. If application smoke tests fail, disable the new application release or restore the prior application artifact while preserving migration history. If database data or schema recovery is required, use the verified staging-tested backup restore process in an isolated recovery project first, then follow the organization’s approved production restoration procedure. Investigate and repair partial application writes before retrying.

15. **Phase B gate.** Only after application deployment, staging verification, zero NULL scoped rows, and cross-store consistency checks pass should a separately reviewed final enforcement migration be copied into `supabase/migrations/` under an available version and rehearsed. The current repository contains only the untested checkout-RPC template outside the active directory; it is not a final enforcement migration and must not be improvised in production.

### 7. Final deployment readiness verdict

**NOT READY**

The implementation has a useful partial Phase A foundation: store resolution is present, catalog reads are store-scoped, cart identity and store scope are threaded through the modified paths, the Phase A migration files exist, and workspace TypeScript, full web-client lint, and the web-client build have passed. However, the concrete evidence does not support staging sign-off or deployment of the complete GreenPlus v2.0 Multi-Tenant upgrade:

- the checkout caller is wired for a restricted, idempotent transactional RPC, and the RPC passed isolated local database tests, but it has not been installed or executed against staging;
- staff/admin/manager/shipper authorization is incomplete;
- many tenant-owned business modules remain unscoped;
- `store_id` remains nullable and same-store consistency is not enforced;
- no final Phase B enforcement migration is present;
- local Phase A migration and checkout smoke tests passed, but no remote/staging migration rehearsal, application-route integration suite, or two-store isolation test has passed.

The upgrade can proceed only as a controlled staging Phase A rehearsal with backup verification, the local baseline-load procedure, and explicit acknowledgement that it is not yet a complete multi-tenant production deployment.
