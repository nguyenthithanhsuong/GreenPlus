-- Keep database status constraints aligned with the application contracts.

ALTER TABLE public.batches
  DROP CONSTRAINT IF EXISTS batches_status_check;

ALTER TABLE public.batches
  ADD CONSTRAINT batches_status_check
  CHECK (status IN ('pending', 'available', 'rejected', 'expired', 'sold_out'));

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_status_check;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_status_check
  CHECK (status IN ('pending', 'paid', 'failed', 'cancelled'));