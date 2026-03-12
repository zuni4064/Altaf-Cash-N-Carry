-- ============================================================================
-- COMPLETE FIX: Restore Profiles and Create Admin User
-- This fixes all the issues
-- ============================================================================

-- Step 1: Drop existing tables to start fresh
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Step 2: Recreate profiles table with correct schema
-- Using user_id as primary key (not separate id column)
CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Step 3: Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Step 4: Set up RLS (with simple policies to avoid recursion)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Profiles: users can view/update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

-- User roles: users can view their own role
CREATE POLICY "Users can view own role" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

-- Step 5: Grant permissions
GRANT ALL ON public.profiles TO anon, authenticated, service_role;
GRANT ALL ON public.user_roles TO anon, authenticated, service_role;

-- Step 6: Create trigger function (simple version without recursion)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert into profiles using user_id as the primary key
  INSERT INTO public.profiles (user_id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (user_id) DO NOTHING;

  -- Insert into user_roles with default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- SKIP USER CREATION IN SQL - Use Supabase Dashboard instead
-- ============================================================================
-- 
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add user"
-- 3. Enter:
--    Email: altafcashncarry@gmail.com
--    Password: Altaf0102!
--    Toggle "Email confirm" to ON
-- 4. Click "Create user"
--
-- AFTER creating the user, run the SQL below (Step 7)
-- ============================================================================

-- Step 7: Set the admin role for the user (run AFTER creating user in Dashboard)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' 
FROM auth.users 
WHERE email = 'altafcashncarry@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

INSERT INTO public.profiles (user_id, full_name)
SELECT id, 'Altaf'
FROM auth.users 
WHERE email = 'altafcashncarry@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET full_name = 'Altaf';

-- Step 8: Verify it worked
SELECT 
  u.email,
  u.created_at,
  p.full_name,
  r.role
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE u.email = 'altafcashncarry@gmail.com';

