
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  page TEXT,
  target TEXT,
  label TEXT,
  referrer TEXT,
  user_agent TEXT,
  session_id TEXT,
  duration_ms INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert analytics events"
ON public.analytics_events
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view analytics events"
ON public.analytics_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
