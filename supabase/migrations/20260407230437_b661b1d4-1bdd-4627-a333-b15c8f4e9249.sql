
CREATE TABLE public.comment_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  interaction_id UUID NOT NULL REFERENCES public.property_interactions(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL,
  reply_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.comment_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all replies"
ON public.comment_replies
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view replies on their own interactions"
ON public.comment_replies
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.property_interactions pi
    WHERE pi.id = comment_replies.interaction_id
    AND pi.user_id = auth.uid()
  )
);

CREATE TRIGGER update_comment_replies_updated_at
BEFORE UPDATE ON public.comment_replies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
