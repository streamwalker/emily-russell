CREATE INDEX IF NOT EXISTS idx_analytics_events_type_created ON public.analytics_events (event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON public.analytics_events (session_id);
CREATE INDEX IF NOT EXISTS idx_property_interactions_user ON public.property_interactions (user_id);