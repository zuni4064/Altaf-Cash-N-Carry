-- ============================================================================
-- Fix Admin Dashboard Queries
-- Run this to fix "Failed to load customers" and "Failed to load orders"
-- ============================================================================

-- Step 1: Add email column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Step 2: Update profiles with emails from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id;

-- Step 3: Set up RLS for orders table (allow admin to read all)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view orders (for admin dashboard)
DROP POLICY IF EXISTS "Anyone can view orders" ON public.orders;
CREATE POLICY "Anyone can view orders" ON public.orders
FOR SELECT USING (true);

-- Allow anyone to insert orders
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders" ON public.orders
FOR INSERT WITH CHECK (true);

-- Allow anyone to update orders
DROP POLICY IF EXISTS "Anyone can update orders" ON public.orders;
CREATE POLICY "Anyone can update orders" ON public.orders
FOR UPDATE USING (true);

-- Step 4: Set up RLS for order_items table
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view order items" ON public.order_items;
CREATE POLICY "Anyone can view order items" ON public.order_items
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
CREATE POLICY "Anyone can create order items" ON public.order_items
FOR INSERT WITH CHECK (true);

-- Step 5: Grant permissions
GRANT ALL ON public.orders TO anon, authenticated, service_role;
GRANT ALL ON public.order_items TO anon, authenticated, service_role;

-- Step 6: Also fix profiles - allow reading all profiles for admin
DROP POLICY IF EXISTS "Anyone can view all profiles" ON public.profiles;
CREATE POLICY "Anyone can view all profiles" ON public.profiles
FOR SELECT USING (true);

-- Step 7: Verify orders exist
SELECT COUNT(*) as order_count FROM public.orders;

-- Step 8: Verify customers exist
SELECT COUNT(*) as customer_count FROM public.profiles;

