CREATE TABLE public.signed_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  agreement_type text NOT NULL DEFAULT 'buyer_rep_trx1501',
  client_name text NOT NULL,
  client_address text,
  client_city_state_zip text,
  client_phone text,
  client_email text,
  market_area text,
  term_start date,
  term_end date,
  broker_fee_pct numeric DEFAULT 3.0,
  signature_data text,
  signature_type text,
  signed_at timestamptz NOT NULL DEFAULT now(),
  form_data jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.signed_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own agreements"
ON public.signed_agreements FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own agreements"
ON public.signed_agreements FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all agreements"
ON public.signed_agreements FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));