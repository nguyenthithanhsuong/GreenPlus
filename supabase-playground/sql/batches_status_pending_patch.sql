BEGIN;

ALTER TABLE batches DROP CONSTRAINT IF EXISTS batches_status_check;

ALTER TABLE batches
ADD CONSTRAINT batches_status_check
CHECK (
  status IN ('pending', 'available', 'expired', 'sold_out')
);

COMMIT;
