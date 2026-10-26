# Migration review (static review; no database execution)

## Observations
- 0001 defines the existing baseline; 0002 adds RLS logic; 0003 aligns status constraints.
- 0004–0009 introduce shared-db multitenancy tables, nullable tenant scope, backfill and V2 features.
- 0010 (`transition_diagnostics`) explicitly identifies **phase A** and states tenant isolation is **not enforced**; it checks that there is exactly one store and prints NOTICE for NULL `store_id` records.
- The supplied product specification contains conflicting architecture descriptions: early proposal says database-per-tenant with Catalog DB; later finalized database section says **Shared DB + Shared Schema, tenant=store**, without per-tenant DB. This review follows the latter final decision.

## Do not run blindly
1. Ensure migration numbers are applied in strict sequence using Supabase migration history. Never repeat a destructive baseline in production.
2. Backup and rehearse on a clone; validate every scoped table including `group_buys` and `group_buy_members`, existing foreign keys and ownership.
3. Inspect missing `store_id` data, backfill correctly and add composite FK/unique/indexes where necessary.
4. Review `SECURITY DEFINER`, service-role bypass, storage policies and per-table RLS before enabling multiple stores.
5. Roll out DB constraints and enforced `store_id NOT NULL` in a separate, verified migration (after code supports store-scoped writes). No migration was created by this package.

## Static-only limitations
No Supabase connection or database credentials were used. No migration was applied or asserted successful.
