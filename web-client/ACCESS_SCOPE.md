# Web Client Access Scope

This app is configured for customer-facing journeys.

Source of truth is shared policy in:
- `@greenplus/supabase-shared/accessPolicy`

## Primary Use Cases
- Product discovery and browsing
- Cart and checkout
- Order and delivery tracking
- Reviews, group-buy, subscriptions, community content
- Profile self-service

## Access Model Notes
- Customers can browse active catalog and public content
- Customers can mutate only ownership data (own profile/cart/orders/reviews/subscriptions)
- Enforcement should happen in Supabase RLS, not only UI checks

## Commonly Used Tables
- categories, products, batches, prices
- carts, cart_items
- orders, order_items, payments, deliveries
- reviews, posts, group_buys, group_buy_members, subscriptions
- users (own profile only)
