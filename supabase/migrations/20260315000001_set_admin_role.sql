-- ============================================================================
-- Migration: Set Admin Role for Altaf Mart User
-- This creates the admin user directly using SQL
-- Run this AFTER running Part 1 (or run this alone if tables exist)
-- ============================================================================

-- Step 1: Create the admin user directly using auth.admin
-- This bypasses the UI issue
SELECT 
  auth.admin.create_user(
    '{"email": "altafcashncarry@gmail.com", "password": "Altaf0102!", "email_confirm": true}'::jsonb
  ) AS created_user;

-- Step 2: Wait a moment for the trigger to run, then set the role to admin
-- The trigger from Part 1 should have created the user with 'user' role
-- This updates it to 'admin'
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get the user ID
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = 'altafcashncarry@gmail.com';

  IF target_user_id IS NOT NULL THEN
    -- Insert or update the role to admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

    -- Update the profile with full name
    INSERT INTO public.profiles (id, user_id, full_name)
    VALUES (target_user_id, target_user_id, 'Altaf')
    ON CONFLICT (user_id) DO UPDATE SET full_name = 'Altaf';
  END IF;
END $$;

-- Step 3: Verify the admin user was created correctly
SELECT 
  u.email,
  u.created_at,
  p.full_name,
  r.role
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE u.email = 'altafcashncarry@gmail.com';

