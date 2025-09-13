-- Add wallet configurations table
CREATE TABLE public.wallet_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  wallet_type text NOT NULL DEFAULT 'lnbits',
  api_key text,
  admin_key text,
  lnbits_url text,
  balance_sats integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallet_config ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own wallet config" 
ON public.wallet_config 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet config" 
ON public.wallet_config 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet config" 
ON public.wallet_config 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_wallet_config_updated_at
BEFORE UPDATE ON public.wallet_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add lightning_address to profiles if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS lightning_address text;

-- Create function to search posts
CREATE OR REPLACE FUNCTION public.search_posts(search_term text)
RETURNS TABLE (
  id uuid,
  title text,
  url text,
  content text,
  category text,
  author_id uuid,
  total_sats integer,
  total_comments integer,
  boost_amount integer,
  is_top_boost boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    p.id,
    p.title,
    p.url,
    p.content,
    p.category,
    p.author_id,
    p.total_sats,
    p.total_comments,
    p.boost_amount,
    p.is_top_boost,
    p.created_at,
    p.updated_at
  FROM public.posts p
  WHERE 
    (search_term = '' OR search_term IS NULL) OR
    (p.title ILIKE '%' || search_term || '%' OR
     p.content ILIKE '%' || search_term || '%' OR
     p.category ILIKE '%' || search_term || '%')
  ORDER BY p.total_sats DESC, p.created_at DESC;
$$;