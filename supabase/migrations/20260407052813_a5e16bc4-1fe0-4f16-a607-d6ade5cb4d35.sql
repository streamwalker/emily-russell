
CREATE TABLE public.property_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  property_id TEXT NOT NULL,
  dossier_id UUID,
  is_favorite BOOLEAN DEFAULT false,
  preferred_tour_date DATE,
  preferred_tour_time TEXT,
  comments TEXT,
  grade TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, property_id)
);

ALTER TABLE public.property_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interactions"
  ON public.property_interactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions"
  ON public.property_interactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interactions"
  ON public.property_interactions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interactions"
  ON public.property_interactions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all interactions"
  ON public.property_interactions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_property_interactions_updated_at
  BEFORE UPDATE ON public.property_interactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
