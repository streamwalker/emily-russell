CREATE TABLE public.dossier_views (
  user_id uuid NOT NULL,
  dossier_id uuid NOT NULL,
  last_viewed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, dossier_id)
);

ALTER TABLE public.dossier_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own dossier views"
ON public.dossier_views
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all dossier views"
ON public.dossier_views
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));