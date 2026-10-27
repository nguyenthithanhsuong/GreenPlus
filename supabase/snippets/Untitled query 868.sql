SELECT
    'products' AS table_name,
    COUNT(*) AS total_rows,
    COUNT(*) FILTER (WHERE store_id IS NULL) AS missing_store
FROM public.products

UNION ALL

SELECT
    'orders',
    COUNT(*),
    COUNT(*) FILTER (WHERE store_id IS NULL)
FROM public.orders

UNION ALL

SELECT
    'cart_items',
    COUNT(*),
    COUNT(*) FILTER (WHERE store_id IS NULL)
FROM public.cart_items

UNION ALL

SELECT
    'payments',
    COUNT(*),
    COUNT(*) FILTER (WHERE store_id IS NULL)
FROM public.payments

UNION ALL

SELECT
    'inventory',
    COUNT(*),
    COUNT(*) FILTER (WHERE store_id IS NULL)
FROM public.inventory;