-- Add name and pinned columns
ALTER TABLE public.saved_estimates 
  ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Default',
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false;

-- Backfill: mark existing single rows as pinned
UPDATE public.saved_estimates SET is_pinned = true WHERE is_pinned = false;

-- Drop the old (user_id, property_id) unique constraint if it exists
DO $$
DECLARE
  con_name TEXT;
BEGIN
  SELECT conname INTO con_name
  FROM pg_constraint
  WHERE conrelid = 'public.saved_estimates'::regclass
    AND contype = 'u'
    AND pg_get_constraintdef(oid) ILIKE '%(user_id, property_id)%'
    AND pg_get_constraintdef(oid) NOT ILIKE '%name%';
  IF con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.saved_estimates DROP CONSTRAINT %I', con_name);
  END IF;
END $$;

-- Add new uniqueness on (user_id, property_id, name)
ALTER TABLE public.saved_estimates
  ADD CONSTRAINT saved_estimates_user_property_name_key
  UNIQUE (user_id, property_id, name);