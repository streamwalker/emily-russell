
CREATE TABLE public.saved_estimates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  property_id TEXT NOT NULL,
  offer_price NUMERIC NOT NULL,
  down_pct NUMERIC NOT NULL DEFAULT 20,
  rate NUMERIC NOT NULL DEFAULT 6.5,
  tax_rate NUMERIC NOT NULL DEFAULT 2.2,
  insurance NUMERIC NOT NULL DEFAULT 150,
  hoa NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, property_id)
);

ALTER TABLE public.saved_estimates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own estimates"
ON public.saved_estimates FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own estimates"
ON public.saved_estimates FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own estimates"
ON public.saved_estimates FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own estimates"
ON public.saved_estimates FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all estimates"
ON public.saved_estimates FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_saved_estimates_updated_at
BEFORE UPDATE ON public.saved_estimates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
