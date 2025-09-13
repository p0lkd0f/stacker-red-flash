-- Fix function search path security issues
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
SECURITY DEFINER
SET search_path = public
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

-- Fix has_role function search path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE 
 SECURITY DEFINER
 SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;