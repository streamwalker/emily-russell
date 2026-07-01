
CREATE TABLE public.property_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id UUID NOT NULL REFERENCES public.client_dossiers(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  uploaded_by UUID NOT NULL,
  uploader_role TEXT NOT NULL CHECK (uploader_role IN ('admin','client')),
  kind TEXT NOT NULL CHECK (kind IN ('photo','video')),
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_property_media_dossier_property ON public.property_media(dossier_id, property_id);
CREATE INDEX idx_property_media_user ON public.property_media(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_media TO authenticated;
GRANT ALL ON public.property_media TO service_role;

ALTER TABLE public.property_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner and admin view property media"
  ON public.property_media FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Client uploads own property media"
  ON public.property_media FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND auth.uid() = uploaded_by AND uploader_role = 'client');

CREATE POLICY "Admin uploads any property media"
  ON public.property_media FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND uploaded_by = auth.uid() AND uploader_role = 'admin');

CREATE POLICY "Owner or admin deletes property media"
  ON public.property_media FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner or admin updates property media"
  ON public.property_media FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
