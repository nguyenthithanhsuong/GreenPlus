# Web Admin Access Scope

This app is configured for operational and governance roles:
- admin
- manager
- employee (delivery)

Source of truth is shared policy in:
- `@greenplus/supabase-shared/accessPolicy`

## Primary Use Cases
- User and role governance
- Supplier approval and platform moderation
- Catalog, batch, inventory, pricing operations
- Orders, payments, deliveries, complaints
- Analytics and platform monitoring

## Access Model Notes
- Admin: full access to platform tables
- Manager: inventory + order operations
- Employee: assigned deliveries and order tracking updates
- Enforcement should happen in Supabase RLS, not only UI checks

## Key Tables
- roles, users, suppliers
- categories, products, batches, inventory, inventory_transactions, prices
- orders, order_items, payments, deliveries, complaints
- posts, reviews, subscriptions, group_buys, group_buy_members
