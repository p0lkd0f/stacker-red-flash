-- Idempotent schema setup
-- 1) Profiles: ensure columns exist if table already present
DO $$ BEGIN
  CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    display_name TEXT,
    bio TEXT,
    lightning_address TEXT,
    avatar_url TEXT,
    total_sats_earned INTEGER DEFAULT 0,
    total_posts INTEGER DEFAULT 0,
    total_followers INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
EXCEPTION WHEN duplicate_table THEN
  NULL;
END $$;

-- Ensure columns exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lightning_address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_sats_earned INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_posts INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_followers INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2) Role enum and user_roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
  );
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

-- 3) Posts
DO $$ BEGIN
  CREATE TABLE public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    url TEXT,
    content TEXT,
    category TEXT NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    total_sats INTEGER DEFAULT 0,
    total_comments INTEGER DEFAULT 0,
    boost_amount INTEGER DEFAULT 0,
    is_top_boost BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

-- 4) Comments
DO $$ BEGIN
  CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    total_sats INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

-- 5) Zaps
DO $$ BEGIN
  CREATE TABLE public.zaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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

-- 6) Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

-- 7) Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zaps ENABLE ROW LEVEL SECURITY;

-- 8) Role helper function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

-- 9) Policies (drop+recreate for idempotency)
-- Profiles
DO $$ BEGIN EXECUTE 'DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles'; END $$;
DO $$ BEGIN EXECUTE 'DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles'; END $$;
DO $$ BEGIN EXECUTE 'DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles'; END $$;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Posts
DO $$ BEGIN EXECUTE 'DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts'; END $$;
DO $$ BEGIN EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts'; END $$;
DO $$ BEGIN EXECUTE 'DROP POLICY IF EXISTS "Authors can update own posts" ON public.posts'; END $$;
DO $$ BEGIN EXECUTE 'DROP POLICY IF EXISTS "Authors and admins can delete posts" ON public.posts'; END $$;
CREATE POLICY "Anyone can view posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors and admins can delete posts" ON public.posts FOR DELETE USING (
  auth.uid() = author_id OR public.has_role(auth.uid(), 'admin')
);

-- Comments
DO $$ BEGIN EXECUTE 'DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments'; END $$;
DO $$ BEGIN EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments'; END $$;
DO $$ BEGIN EXECUTE 'DROP POLICY IF EXISTS "Authors can update own comments" ON public.comments'; END $$;
DO $$ BEGIN EXECUTE 'DROP POLICY IF EXISTS "Authors and admins can delete comments" ON public.comments'; END $$;
CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own comments" ON public.comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors and admins can delete comments" ON public.comments FOR DELETE USING (
  auth.uid() = author_id OR public.has_role(auth.uid(), 'admin')
);

-- Zaps
DO $$ BEGIN EXECUTE 'DROP POLICY IF EXISTS "Users can view zaps they sent or received" ON public.zaps'; END $$;
DO $$ BEGIN EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can create zaps" ON public.zaps'; END $$;
CREATE POLICY "Users can view zaps they sent or received" ON public.zaps FOR SELECT USING (
  auth.uid() = from_user_id OR auth.uid() = to_user_id OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Authenticated users can create zaps" ON public.zaps FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- user_roles
DO $$ BEGIN EXECUTE 'DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles'; END $$;
DO $$ BEGIN EXECUTE 'DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles'; END $$;
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Storage policies
DO $$ BEGIN EXECUTE 'DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects'; END $$;
DO $$ BEGIN EXECUTE 'DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects'; END $$;
DO $$ BEGIN EXECUTE 'DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects'; END $$;
DO $$ BEGIN EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects'; END $$;
DO $$ BEGIN EXECUTE 'DROP POLICY IF EXISTS "Post images are publicly accessible" ON storage.objects'; END $$;
DO $$ BEGIN EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can upload post images" ON storage.objects'; END $$;
DO $$ BEGIN EXECUTE 'DROP POLICY IF EXISTS "Users can update their own post images" ON storage.objects'; END $$;
DO $$ BEGIN EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own post images" ON storage.objects'; END $$;
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Post images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'post-images');
CREATE POLICY "Authenticated users can upload post images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'post-images' AND auth.uid() IS NOT NULL
);
CREATE POLICY "Users can update their own post images" ON storage.objects FOR UPDATE USING (
  bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can delete their own post images" ON storage.objects FOR DELETE USING (
  bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 10) Triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email)
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    display_name = EXCLUDED.display_name;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Drop/recreate trigger to ensure it's present once
DO $$ BEGIN
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
END $$;

-- Timestamp update function + triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
  CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END $$;
DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;
  CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END $$;
DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_comments_updated_at ON public.comments;
  CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END $$;
DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_zaps_updated_at ON public.zaps;
  CREATE TRIGGER update_zaps_updated_at BEFORE UPDATE ON public.zaps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END $$;