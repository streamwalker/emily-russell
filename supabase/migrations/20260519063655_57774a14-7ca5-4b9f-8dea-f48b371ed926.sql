-- Canonical home records keyed by normalized address
CREATE TABLE public.homes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text NOT NULL,
  address_key text NOT NULL UNIQUE,
  beds numeric,
  baths numeric,
  sqft integer,
  year_built integer,
  lot_size text,
  builder text,
  condition text,
  sources jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_autofill_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_homes_address_key ON public.homes(address_key);

ALTER TABLE public.homes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all homes"
  ON public.homes FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_homes_updated_at
  BEFORE UPDATE ON public.homes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Link CMA reports to canonical home + persist per-field source URLs
ALTER TABLE public.cma_reports
  ADD COLUMN home_id uuid REFERENCES public.homes(id) ON DELETE SET NULL,
  ADD COLUMN subject_sources jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX idx_cma_reports_home_id ON public.cma_reports(home_id);