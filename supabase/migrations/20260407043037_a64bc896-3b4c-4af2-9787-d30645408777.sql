
INSERT INTO storage.buckets (id, name, public)
VALUES ('agreement-templates', 'agreement-templates', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access for agreement templates"
ON storage.objects FOR SELECT
USING (bucket_id = 'agreement-templates');

CREATE POLICY "Admins can upload agreement templates"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'agreement-templates' AND public.has_role(auth.uid(), 'admin'));
