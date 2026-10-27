-- GreenPlus V2 / 0012: nullable coordinates for existing user/legacy orders.
-- New writes must be validated by API; historic data is intentionally not guessed/backfilled.
BEGIN;
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS latitude numeric(10,7),
  ADD COLUMN IF NOT EXISTS longitude numeric(10,7);
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_latitude numeric(10,7),
  ADD COLUMN IF NOT EXISTS delivery_longitude numeric(10,7);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='greenplus_users_coords_pair') THEN
    ALTER TABLE public.users ADD CONSTRAINT greenplus_users_coords_pair CHECK (
      (latitude IS NULL AND longitude IS NULL) OR
      (latitude IS NOT NULL AND longitude IS NOT NULL AND latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
    ) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='greenplus_order_coords_pair') THEN
    ALTER TABLE public.orders ADD CONSTRAINT greenplus_order_coords_pair CHECK (
      (delivery_latitude IS NULL AND delivery_longitude IS NULL) OR
      (delivery_latitude IS NOT NULL AND delivery_longitude IS NOT NULL AND delivery_latitude BETWEEN -90 AND 90 AND delivery_longitude BETWEEN -180 AND 180)
    ) NOT VALID;
  END IF;
END $$;
COMMIT;
