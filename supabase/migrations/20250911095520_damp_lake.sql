@@ .. @@
 DO $$ BEGIN
   CREATE TABLE public.comments (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
-    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
+    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
     content TEXT NOT NULL,
     total_sats INTEGER DEFAULT 0,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
 EXCEPTION WHEN duplicate_table THEN NULL; END $$;
 
+-- Update existing comments table if it already exists
+DO $$ BEGIN
+  -- Drop existing foreign key constraint if it exists
+  ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_author_id_fkey;
+  -- Add new foreign key constraint referencing profiles
+  ALTER TABLE public.comments ADD CONSTRAINT comments_author_id_fkey 
+    FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
+EXCEPTION WHEN OTHERS THEN NULL; END $$;
+
 -- 5) Zaps