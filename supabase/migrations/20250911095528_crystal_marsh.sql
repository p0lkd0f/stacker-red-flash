@@ .. @@
 -- user_roles
 DO $$ BEGIN
   CREATE TABLE public.user_roles (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
-    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
+    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
     role app_role NOT NULL,
     UNIQUE (user_id, role)
   );
 EXCEPTION WHEN duplicate_table THEN NULL; END $$;
 
+-- Update existing user_roles table if it already exists
+DO $$ BEGIN
+  -- Drop existing foreign key constraint if it exists
+  ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
+  -- Add new foreign key constraint referencing profiles
+  ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_fkey 
+    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
+EXCEPTION WHEN OTHERS THEN NULL; END $$;
+
 -- 3) Posts