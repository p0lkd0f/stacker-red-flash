-- Add foreign key relationships for proper joins
ALTER TABLE public.posts 
ADD CONSTRAINT posts_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.comments 
ADD CONSTRAINT comments_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.comments 
ADD CONSTRAINT comments_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

ALTER TABLE public.zaps 
ADD CONSTRAINT zaps_from_user_id_fkey 
FOREIGN KEY (from_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.zaps 
ADD CONSTRAINT zaps_to_user_id_fkey 
FOREIGN KEY (to_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.zaps 
ADD CONSTRAINT zaps_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

ALTER TABLE public.zaps 
ADD CONSTRAINT zaps_comment_id_fkey 
FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;