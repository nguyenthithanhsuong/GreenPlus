# Shipper API contract v0 (proposed; NOT implemented upstream)

This contract isolates the Shipper UI from the legacy Web Admin API. Never simply proxy the existing `/api/deliveries`: the inspected admin endpoints do not independently enforce shipper identity / ownership.

- `GET /shipper/deliveries` returns `{items: Delivery[], total: number}`. Each `Delivery` contains `order_id`, `delivery_id`, `customer_name`, `delivery_address`, `total_amount`, `status`, `pickup_time`.
- `PATCH /shipper/deliveries/:orderId/status` with `{status: "picked_up" | "delivering" | "delivered"}` returns updated `Delivery`.
- Header: `Authorization: Bearer <access-token>` required. Backend MUST validate JWT, active shipper membership, `store_id`, and ownership/assignment. The server must look up current status atomically; client-provided `currentStatus` is advisory ONLY.
- Legal transitions: assigned -> picked_up -> delivering -> delivered. Must prevent out-of-order/repeated state updates. Use optimistic concurrency / locked transaction and idempotency to avoid duplicate external events.
- Errors: 401 unauthenticated, 403 not allowed, 404 not found/hidden, 409 invalid transition, 422 bad input.
- Backend controls COD, customer contact visibility, GPS updates, evidence upload, audit, transactional order status changes, and store-scoped RLS.

Web-shipper uses `GREENPLUS_SHIPPER_API_BASE_URL`; the adapter forwards bearer tokens. UI's manual token entry is temporary developer-only wiring, not a production login implementation.
