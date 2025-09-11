@@ .. @@
 DO $$ BEGIN
   CREATE TABLE public.zaps (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
-    from_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
-    to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
+    from_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
+    to_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
     post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
     comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
     amount_sats INTEGER NOT NULL,
     payment_hash TEXT,
     invoice TEXT,
     status TEXT DEFAULT 'pending',
     comment TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
 EXCEPTION WHEN duplicate_table THEN NULL; END $$;
 
+-- Update existing zaps table if it already exists
+DO $$ BEGIN
+  -- Drop existing foreign key constraints if they exist
+  ALTER TABLE public.zaps DROP CONSTRAINT IF EXISTS zaps_from_user_id_fkey;
+  ALTER TABLE public.zaps DROP CONSTRAINT IF EXISTS zaps_to_user_id_fkey;
+  -- Add new foreign key constraints referencing profiles
+  ALTER TABLE public.zaps ADD CONSTRAINT zaps_from_user_id_fkey 
+    FOREIGN KEY (from_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
+  ALTER TABLE public.zaps ADD CONSTRAINT zaps_to_user_id_fkey 
+    FOREIGN KEY (to_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
+EXCEPTION WHEN OTHERS THEN NULL; END $$;
+
 -- 6) Buckets