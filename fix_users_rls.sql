-- Ensure public.users table exists with correct schema
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    gender TEXT,
    city TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might be blocking access
DROP POLICY IF EXISTS "Enable insert for everyone" ON public.users;
DROP POLICY IF EXISTS "Enable select for everyone" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.users;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON public.users;
DROP POLICY IF EXISTS "Allow anon read" ON public.users;
DROP POLICY IF EXISTS "Allow individual insert" ON public.users;
DROP POLICY IF EXISTS "Enable all access for admins" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.users;

-- Create policies to allow registration (Insert) and admin panel viewing (Select)
CREATE POLICY "Enable insert for everyone" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Enable update for users based on id" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Enable delete for everyone" ON public.users FOR DELETE USING (true);

-- IMPORTANT: Run this query to sync any users that registered but failed to insert due to RLS
INSERT INTO public.users (id, name, email, role, created_at)
SELECT id, raw_user_meta_data->>'full_name', email, 'user', created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;
