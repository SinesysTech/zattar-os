-- Migration: Fix auth.users NULL values in token columns
-- This migration fixes the "converting NULL to string is unsupported" error
-- that occurs when Supabase Auth tries to load users with NULL values in certain columns.
--
-- Issue: Supabase Auth GoTrue service cannot handle NULL values in these columns:
-- - confirmation_token
-- - email_change
-- - email_change_token_new
-- - recovery_token
--
-- Solution: Update all NULL values to empty strings ('')
-- This is the official fix recommended by Supabase community:
-- https://github.com/orgs/supabase/discussions/17106
--
-- IMPORTANT: This migration modifies the auth schema which is managed by Supabase Auth service.
-- Only run this if you're experiencing the NULL conversion error.
-- This is a data-only migration and does not alter table structure.

-- Update NULL values to empty strings in auth.users table
-- This prevents "sql: Scan error on column index X, name 'column_name': converting NULL to string is unsupported"
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

-- Log how many rows were affected
DO $$
DECLARE
  affected_count integer;
BEGIN
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RAISE NOTICE 'Updated % user records to fix NULL token columns', affected_count;
END $$;
