CREATE POLICY "Admins can delete any estimate"
  ON public.saved_estimates FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));