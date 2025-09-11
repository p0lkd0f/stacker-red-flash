@@ .. @@
 DO $$ BEGIN
   CREATE TABLE public.posts (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     title TEXT NOT NULL,
     url TEXT,
     content TEXT,
     category TEXT NOT NULL,
-    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
+    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
     total_sats INTEGER DEFAULT 0,
     total_comments INTEGER DEFAULT 0,
     boost_amount INTEGER DEFAULT 0,
     is_top_boost BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
 EXCEPTION WHEN duplicate_table THEN NULL; END $$;
 
+-- Update existing posts table if it already exists
+DO $$ BEGIN
+  -- Drop existing foreign key constraint if it exists
+  ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_author_id_fkey;
+  -- Add new foreign key constraint referencing profiles
+  ALTER TABLE public.posts ADD CONSTRAINT posts_author_id_fkey 
+    FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
+EXCEPTION WHEN OTHERS THEN NULL; END $$;
+
 -- 4) Comments