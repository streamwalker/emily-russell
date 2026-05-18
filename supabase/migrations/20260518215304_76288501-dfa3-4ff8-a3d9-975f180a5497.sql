
-- CMA reports table
CREATE TABLE public.cma_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL,
  address TEXT NOT NULL,
  subject_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  comps_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  narrative TEXT,
  executive_summary TEXT,
  value_low NUMERIC,
  value_recommended NUMERIC,
  value_high NUMERIC,
  ppsf_low NUMERIC,
  ppsf_recommended NUMERIC,
  ppsf_high NUMERIC,
  status TEXT NOT NULL DEFAULT 'draft',
  pdf_path TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cma_reports_created_by ON public.cma_reports(created_by, created_at DESC);

ALTER TABLE public.cma_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all CMA reports"
ON public.cma_reports
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER cma_reports_set_updated_at
BEFORE UPDATE ON public.cma_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('cma-reports', 'cma-reports', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins read CMA report files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'cma-reports' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins upload CMA report files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cma-reports' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update CMA report files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'cma-reports' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete CMA report files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'cma-reports' AND has_role(auth.uid(), 'admin'::app_role));
