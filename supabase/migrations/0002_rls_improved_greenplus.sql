-- 0002_rls_improved_greenplus
-- Date:    2026-10-03
-- What:    Enable Row Level Security on the 20 public tables that did not have it.
-- Effect:  anon/authenticated can no longer read or write these tables through the
--          REST API or Realtime unless a policy allows it. The backend uses the
--          service role, which bypasses RLS, so it is unaffected.
-- Note:    Already applied manually in the Supabase dashboard on 2026-10-03.
--          Idempotent, so it is safe to run again.

ALTER TABLE public.batches                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_buy_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_buys             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prices                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users                  ENABLE ROW LEVEL SECURITY;