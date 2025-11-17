# Quick Start: Apply Supabase Auth Fix

## Problem
Getting this error when deleting users or during login:
```
"error": "sql: Scan error on column index 8, name \"email_change\": converting NULL to string is unsupported"
```

## Quick Fix (5 minutes)

### Step 1: Choose Your Method

#### Method A: Supabase Dashboard (Easiest - Do This First)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in left sidebar
4. Click **New Query**
5. Copy all contents from: `supabase/FIX_AUTH_NULL_QUICK.sql`
6. Paste into the editor
7. Click **Run** (or press Ctrl+Enter)
8. Verify output shows `remaining_nulls: 0`

**Done!** The error should be fixed immediately.

#### Method B: Supabase CLI (For Version Control)

**Prerequisites:**
- Install Supabase CLI: `npm install -g supabase`
- Have your project reference ID ready

**Commands:**
```bash
# 1. Link your project (first time only)
supabase link --project-ref YOUR_PROJECT_REF

# 2. Apply the migration
supabase db push

# 3. Verify
supabase migration list
```

### Step 2: Test the Fix

Try the operation that was failing before:
- Delete a user via Admin API
- Log in with a user
- Use signInWithOtp

The error should be gone.

### Step 3: Verify in Database (Optional)

Run this query to confirm no NULLs remain:

```sql
SELECT COUNT(*)
FROM auth.users
WHERE
  confirmation_token IS NULL
  OR email_change IS NULL
  OR email_change_token_new IS NULL
  OR recovery_token IS NULL;
```

Expected: `0`

## What This Does

Updates 4 columns in `auth.users` table:
- `confirmation_token` → empty string if NULL
- `email_change` → empty string if NULL
- `email_change_token_new` → empty string if NULL
- `recovery_token` → empty string if NULL

## Is This Safe?

**YES!** This fix is:
- Data-only (no schema changes)
- Recommended by Supabase community
- Non-destructive (only updates NULLs)
- Fast (< 1 second for most databases)
- Reversible (though unnecessary)

## Files Created

1. **supabase/FIX_AUTH_NULL_QUICK.sql**
   - Direct SQL to run in Supabase Dashboard
   - Includes verification queries

2. **supabase/migrations/20251117030000_fix_auth_users_null_columns.sql**
   - Full migration file
   - For version control and CLI deployment

3. **supabase/AUTH_SCHEMA_FIX.md**
   - Complete documentation
   - Technical details
   - Prevention tips

4. **APPLY_AUTH_FIX.md** (this file)
   - Quick start guide

## Troubleshooting

### "Permission denied for schema auth"
- You need admin access to your Supabase project
- Use the dashboard method instead

### "Migration already applied"
- Good! The fix is already in place
- Run the verification query to confirm

### Error persists after fix
1. Verify the query ran successfully
2. Check you're in the correct project
3. Check Supabase logs for different errors
4. See `supabase/AUTH_SCHEMA_FIX.md` for detailed troubleshooting

## Need More Details?

See: `supabase/AUTH_SCHEMA_FIX.md` for:
- Root cause analysis
- Technical explanation
- Prevention strategies
- Multiple application methods
- Complete troubleshooting guide

## Support

- **Documentation:** See `AUTH_SCHEMA_FIX.md`
- **Supabase Docs:** https://supabase.com/docs/guides/auth/troubleshooting
- **Community:** https://github.com/orgs/supabase/discussions/17106
- **Status:** https://status.supabase.com
