-- Allow bookmark interactions in post_interactions.type
ALTER TABLE post_interactions DROP CONSTRAINT IF EXISTS post_interactions_type_check;

ALTER TABLE post_interactions
ADD CONSTRAINT post_interactions_type_check
CHECK (
  type IN ('like', 'comment', 'bookmark')
);
