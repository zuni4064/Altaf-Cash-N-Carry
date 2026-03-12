-- ============================================================================
-- Cleanup Script: Remove all admin and user data from the database
-- This script only deletes DATA, not the schema (tables remain intact)
-- ============================================================================

-- Step 1: Delete all records from user_roles table
-- This removes all role assignments (admin/user)
DELETE FROM user_roles;

-- Step 2: Delete all records from profiles table
-- This removes all user profile data (full_name, phone)
DELETE FROM profiles;

-- Step 3: Delete all users from auth.users table
-- This removes all authentication records
DELETE FROM auth.users;

-- ============================================================================
-- Verification queries (run these to confirm deletion)
-- ============================================================================

-- Check remaining records in user_roles
-- Expected result: 0 rows
-- SELECT COUNT(*) FROM user_roles;

-- Check remaining records in profiles
-- Expected result: 0 rows
-- SELECT COUNT(*) FROM profiles;

-- Check remaining users in auth.users
-- Expected result: 0 rows
-- SELECT COUNT(*) FROM auth.users;
