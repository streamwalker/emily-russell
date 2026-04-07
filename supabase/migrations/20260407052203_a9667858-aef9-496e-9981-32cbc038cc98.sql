
CREATE TABLE public.agreement_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL,
  term_end DATE,
  broker_fee_pct NUMERIC(5,2) DEFAULT 3.0,
  updated_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_user_id)
);

ALTER TABLE public.agreement_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage configs" ON public.agreement_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients read own config" ON public.agreement_config
  FOR SELECT TO authenticated
  USING (client_user_id = auth.uid());
