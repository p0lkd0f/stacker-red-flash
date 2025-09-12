-- Fix posts -> profiles relationship for PostgREST joins
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_author_id_fkey;
ALTER TABLE public.posts
  ADD CONSTRAINT posts_author_id_fkey
  FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;