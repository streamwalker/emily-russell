ALTER TABLE public.saved_estimates ADD COLUMN IF NOT EXISTS loan_term INTEGER NOT NULL DEFAULT 30;

CREATE POLICY "Admins can insert any estimate"
  ON public.saved_estimates FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update any estimate"
  ON public.saved_estimates FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));