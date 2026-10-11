-- Phase A: new tables. Cross-store FKs for product/batch are added only in later enforcement.
-- IMPORTANT: target existing GreenPlus v1 schema (0001-0003 applied).
-- This suite is additive; do not use on a different schema without review.

BEGIN;
-- Store-scoped AI inventory notifications.
CREATE TABLE public.inventory_alerts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 store_id uuid NOT NULL REFERENCES public.stores(store_id),
 product_id uuid NOT NULL,
 batch_id uuid,
 type text NOT NULL CHECK(type IN ('low_stock','near_expiry','overstock')),
 severity text NOT NULL DEFAULT 'medium' CHECK(severity IN ('low','medium','high','critical')),
 days_to_expiry integer,
 predicted_stockout_date date,
 status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','acknowledged','resolved')),
 model_version text,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT ia_product_fk FOREIGN KEY(product_id) REFERENCES public.products(product_id),
 CONSTRAINT ia_batch_fk FOREIGN KEY(batch_id) REFERENCES public.batches(batch_id)
);
CREATE INDEX idx_inventory_alerts_store_status ON public.inventory_alerts(store_id,status,created_at DESC);

CREATE TABLE public.promotion_suggestions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 store_id uuid NOT NULL REFERENCES public.stores(store_id),
 product_id uuid NOT NULL,
 batch_id uuid,
 suggested_discount_pct numeric(5,2) NOT NULL CHECK(suggested_discount_pct > 0 AND suggested_discount_pct <= 100),
 suggested_start_at timestamptz NOT NULL,
 suggested_end_at timestamptz NOT NULL,
 reason text NOT NULL,
 expected_sell_through numeric(5,2) CHECK(expected_sell_through BETWEEN 0 AND 100),
 model_version text NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected','expired')),
 decided_by uuid REFERENCES public.users(user_id),
 decided_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(suggested_end_at > suggested_start_at),
 CONSTRAINT ps_product_fk FOREIGN KEY(product_id) REFERENCES public.products(product_id),
 CONSTRAINT ps_batch_fk FOREIGN KEY(batch_id) REFERENCES public.batches(batch_id)
);
ALTER TABLE public.promotion_suggestions ADD CONSTRAINT uq_ps_store_id UNIQUE(store_id,id);
CREATE INDEX idx_promotion_suggestions_store_status ON public.promotion_suggestions(store_id,status,created_at DESC);

CREATE TABLE public.promotions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 store_id uuid NOT NULL REFERENCES public.stores(store_id),
 scope text NOT NULL CHECK(scope IN ('product','batch')),
 product_id uuid NOT NULL,
 batch_id uuid,
 discount_type text NOT NULL CHECK(discount_type IN ('percentage','fixed_amount')),
 discount_value numeric(12,2) NOT NULL CHECK(discount_value > 0),
 start_at timestamptz NOT NULL,
 end_at timestamptz NOT NULL,
 source text NOT NULL DEFAULT 'manual' CHECK(source IN ('manual','ai_suggestion')),
 suggestion_id uuid,
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','paused','expired','cancelled')),
 created_by uuid REFERENCES public.users(user_id),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(end_at > start_at),
 CHECK((scope='product' AND batch_id IS NULL) OR (scope='batch' AND batch_id IS NOT NULL)),
 CHECK(discount_type <> 'percentage' OR discount_value <= 100),
 CHECK((source='manual' AND suggestion_id IS NULL) OR (source='ai_suggestion' AND suggestion_id IS NOT NULL)),
 CONSTRAINT promotions_product_fk FOREIGN KEY(product_id) REFERENCES public.products(product_id),
 CONSTRAINT promotions_batch_fk FOREIGN KEY(batch_id) REFERENCES public.batches(batch_id),
 CONSTRAINT promotions_suggestion_same_store FOREIGN KEY(store_id,suggestion_id) REFERENCES public.promotion_suggestions(store_id,id)
);
CREATE INDEX idx_promotions_store_status_window ON public.promotions(store_id,status,start_at,end_at);

ALTER TABLE public.inventory_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.inventory_alerts,public.promotion_suggestions,public.promotions FROM anon,authenticated;
COMMIT;
