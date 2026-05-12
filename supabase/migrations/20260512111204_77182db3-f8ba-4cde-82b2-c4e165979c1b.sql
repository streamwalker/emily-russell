
-- Private bucket for client-uploaded dossier PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('dossier-documents', 'dossier-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Table tracking each saved PDF
CREATE TABLE public.dossier_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id UUID NOT NULL REFERENCES public.client_dossiers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  page_count INTEGER NOT NULL DEFAULT 0,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dossier_documents_dossier ON public.dossier_documents(dossier_id);
CREATE INDEX idx_dossier_documents_user ON public.dossier_documents(user_id);

ALTER TABLE public.dossier_documents ENABLE ROW LEVEL SECURITY;

-- Client policies
CREATE POLICY "Clients view own documents"
  ON public.dossier_documents FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Clients insert own documents"
  ON public.dossier_documents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND auth.uid() = uploaded_by);

CREATE POLICY "Clients delete own documents"
  ON public.dossier_documents FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins manage all documents"
  ON public.dossier_documents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Storage RLS on the new bucket: path = {user_id}/{document_id}.pdf
CREATE POLICY "Clients read own dossier documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'dossier-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Clients upload own dossier documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'dossier-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Clients delete own dossier documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'dossier-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins manage all dossier documents"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'dossier-documents' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'dossier-documents' AND public.has_role(auth.uid(), 'admin'));
