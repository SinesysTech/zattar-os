-- VERIFICATION SCRIPT: Check Supabase Auth NULL Columns Issue
-- Run this in Supabase SQL Editor to diagnose and verify the fix
--
-- This script will:
-- 1. Check if NULL values exist in auth.users
-- 2. Show which users are affected
-- 3. Verify the fix was applied correctly
-- 4. Display summary statistics

-- ============================================
-- SECTION 1: Check for NULL values
-- ============================================
-- This query counts how many users have NULL values in token columns
-- Expected BEFORE fix: > 0
-- Expected AFTER fix: 0

SELECT
  COUNT(*) as total_affected_users,
  COUNT(CASE WHEN confirmation_token IS NULL THEN 1 END) as null_confirmation_token,
  COUNT(CASE WHEN email_change IS NULL THEN 1 END) as null_email_change,
  COUNT(CASE WHEN email_change_token_new IS NULL THEN 1 END) as null_email_change_token_new,
  COUNT(CASE WHEN recovery_token IS NULL THEN 1 END) as null_recovery_token
FROM auth.users
WHERE
  confirmation_token IS NULL
  OR email_change IS NULL
  OR email_change_token_new IS NULL
  OR recovery_token IS NULL;

-- ============================================
-- SECTION 2: List affected users (if any)
-- ============================================
-- Shows which specific users have NULL values
-- Useful for debugging or audit purposes

SELECT
  id,
  email,
  created_at,
  CASE WHEN confirmation_token IS NULL THEN 'NULL' ELSE 'OK' END as confirmation_token_status,
  CASE WHEN email_change IS NULL THEN 'NULL' ELSE 'OK' END as email_change_status,
  CASE WHEN email_change_token_new IS NULL THEN 'NULL' ELSE 'OK' END as email_change_token_new_status,
  CASE WHEN recovery_token IS NULL THEN 'NULL' ELSE 'OK' END as recovery_token_status
FROM auth.users
WHERE
  confirmation_token IS NULL
  OR email_change IS NULL
  OR email_change_token_new IS NULL
  OR recovery_token IS NULL
ORDER BY created_at DESC
LIMIT 100;

-- ============================================
-- SECTION 3: Overall statistics
-- ============================================
-- Shows the overall state of auth.users table

SELECT
  COUNT(*) as total_users,
  COUNT(CASE WHEN confirmation_token = '' THEN 1 END) as empty_confirmation_token,
  COUNT(CASE WHEN email_change = '' THEN 1 END) as empty_email_change,
  COUNT(CASE WHEN email_change_token_new = '' THEN 1 END) as empty_email_change_token_new,
  COUNT(CASE WHEN recovery_token = '' THEN 1 END) as empty_recovery_token,
  COUNT(CASE WHEN confirmation_token IS NOT NULL AND confirmation_token != '' THEN 1 END) as active_confirmation_tokens,
  COUNT(CASE WHEN email_change IS NOT NULL AND email_change != '' THEN 1 END) as active_email_changes,
  COUNT(CASE WHEN recovery_token IS NOT NULL AND recovery_token != '' THEN 1 END) as active_recovery_tokens
FROM auth.users;

-- ============================================
-- SECTION 4: Health check
-- ============================================
-- Final verification - should return TRUE after fix

SELECT
  CASE
    WHEN COUNT(*) = 0 THEN 'HEALTHY: No NULL values found'
    ELSE 'WARNING: ' || COUNT(*) || ' users have NULL values - Run the fix!'
  END as health_status
FROM auth.users
WHERE
  confirmation_token IS NULL
  OR email_change IS NULL
  OR email_change_token_new IS NULL
  OR recovery_token IS NULL;

-- ============================================
-- INTERPRETATION GUIDE
-- ============================================
--
-- BEFORE FIX:
-- - Section 1: Shows numbers > 0
-- - Section 2: Lists affected users
-- - Section 4: Shows "WARNING" message
--
-- AFTER FIX:
-- - Section 1: All counts should be 0
-- - Section 2: No rows returned
-- - Section 3: Shows most users have empty strings ('')
-- - Section 4: Shows "HEALTHY" message
--
-- If you see NULLs, run: supabase/FIX_AUTH_NULL_QUICK.sql
