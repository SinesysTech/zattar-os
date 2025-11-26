-- QUICK FIX: Supabase Auth NULL Columns Error
-- Run this directly in Supabase SQL Editor for immediate fix
--
-- Error: "sql: Scan error on column index 8, name 'email_change': converting NULL to string is unsupported"
-- Solution: Update NULL values to empty strings in auth.users table
--
-- SAFE TO RUN: This only updates data, doesn't alter schema
-- TIME: Usually completes in < 1 second for small databases

-- Update all NULL token columns to empty strings
UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  recovery_token = COALESCE(recovery_token, '')
WHERE
  confirmation_token IS NULL
  OR email_change IS NULL
  OR email_change_token_new IS NULL
  OR recovery_token IS NULL;

-- Verify the fix (should return 0)
SELECT COUNT(*) as remaining_nulls
FROM auth.users
WHERE
  confirmation_token IS NULL
  OR email_change IS NULL
  OR email_change_token_new IS NULL
  OR recovery_token IS NULL;

-- Show summary
SELECT
  COUNT(*) as total_users,
  COUNT(CASE WHEN confirmation_token = '' THEN 1 END) as empty_confirmation_token,
  COUNT(CASE WHEN email_change = '' THEN 1 END) as empty_email_change,
  COUNT(CASE WHEN email_change_token_new = '' THEN 1 END) as empty_email_change_token_new,
  COUNT(CASE WHEN recovery_token = '' THEN 1 END) as empty_recovery_token
FROM auth.users;
