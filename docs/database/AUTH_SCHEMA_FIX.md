# Supabase Auth Schema Bug Fix

## The Problem

### Error Message
```
"error": "sql: Scan error on column index 8, name \"email_change\": converting NULL to string is unsupported"
```

### Root Cause
Supabase's GoTrue Auth service (written in Go) cannot handle NULL values in certain columns of the `auth.users` table. When the Go code tries to scan database rows into string variables, NULL values cause a type conversion error because Go's `string` type doesn't have a built-in NULL representation.

### Affected Columns
Four columns in `auth.users` are affected:
- `confirmation_token` - Used for email confirmation
- `email_change` - Stores the new email during email change process
- `email_change_token_new` - Token for confirming new email
- `recovery_token` - Token for password recovery

### When This Occurs
This error typically happens when:
1. Users are created manually or via seeding without initializing these columns
2. Deleting users via Supabase Auth Admin API
3. Using `signInWithOtp` functionality
4. Any operation that queries the `auth.users` table

### Why This Happens
The GoTrue service expects these columns to contain empty strings (`''`) rather than SQL NULL values. When users are created through the standard Supabase Auth API, these columns are properly initialized to empty strings. However, direct database operations or certain edge cases can leave NULL values.

## The Solution

### SQL Fix
The fix updates all NULL values to empty strings:

```sql
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
```

### Migration File
We've created a migration file at:
```
supabase/migrations/20251117030000_fix_auth_users_null_columns.sql
```

## How to Apply the Fix

### Option 1: Using Supabase Dashboard (Recommended for Quick Fix)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the SQL from `supabase/migrations/20251117030000_fix_auth_users_null_columns.sql`
5. Click **Run**
6. Verify the output shows how many rows were updated

**Pros:**
- Immediate fix
- No CLI required
- Easy to verify

**Cons:**
- Migration not tracked in version control
- Need to apply manually to each environment

### Option 2: Using Supabase CLI (Recommended for Production)

**Prerequisites:**
- Supabase CLI installed (`npm install -g supabase`)
- Project linked to your Supabase instance

**Steps:**

1. **Verify you have the migration file:**
   ```bash
   ls supabase/migrations/20251117030000_fix_auth_users_null_columns.sql
   ```

2. **Link your project (if not already linked):**
   ```bash
   supabase link --project-ref <your-project-ref>
   ```

3. **Apply the migration:**
   ```bash
   supabase db push
   ```

   Or apply specific migration:
   ```bash
   supabase migration up
   ```

4. **Verify the migration was applied:**
   ```bash
   supabase migration list
   ```

**Pros:**
- Migration tracked in version control
- Automatically applied to all environments
- Can be rolled back if needed
- Part of your deployment pipeline

**Cons:**
- Requires CLI setup
- Requires project linking

### Option 3: Direct Database Access (Advanced Users Only)

**Warning:** Only use this if you have direct PostgreSQL access and understand the risks.

1. Connect to your database using `psql` or a database client
2. Switch to the `auth` schema
3. Run the UPDATE query directly
4. Commit the transaction

## Verification

After applying the fix, verify it worked:

```sql
-- Check if any NULL values remain
SELECT COUNT(*)
FROM auth.users
WHERE
  confirmation_token IS NULL
  OR email_change IS NULL
  OR email_change_token_new IS NULL
  OR recovery_token IS NULL;
```

Expected result: `0` rows

## Prevention

To prevent this issue in the future:

### 1. When Creating Users Programmatically

Always initialize these columns explicitly:

```sql
INSERT INTO auth.users (
  email,
  encrypted_password,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token,
  -- other columns...
)
VALUES (
  'user@example.com',
  'hashed_password',
  '',  -- Not NULL
  '',  -- Not NULL
  '',  -- Not NULL
  '',  -- Not NULL
  -- other values...
);
```

### 2. When Using Seed Scripts

Ensure your seed data includes empty strings:

```javascript
const { data, error } = await supabase.auth.admin.createUser({
  email: 'user@example.com',
  password: 'password',
  email_confirm: true,
  user_metadata: {}
})
```

**Note:** When using the official Supabase Auth API (`auth.admin.createUser`), these columns are automatically initialized correctly.

### 3. Avoid Direct Database Modifications

- Don't modify `auth.users` table directly
- Use Supabase Auth API for user management
- If you must modify directly, ensure these columns are never NULL

## Technical Details

### Why Go Can't Handle NULL in String Columns

In Go (the language GoTrue is written in), when scanning database rows:

```go
var emailChange string
err := row.Scan(&emailChange)  // Fails if emailChange is NULL
```

Go's `string` type doesn't have a NULL state. To handle NULLs, Go uses `sql.NullString`:

```go
var emailChange sql.NullString
err := row.Scan(&emailChange)  // Works with NULL
if emailChange.Valid {
    // Use emailChange.String
}
```

The Supabase Auth service expects these columns to always contain values (even if empty), so it uses `string` instead of `sql.NullString`.

### Database Column Definitions

The columns are defined as nullable in the schema:

```sql
CREATE TABLE auth.users (
  -- ...
  confirmation_token VARCHAR(255),      -- Nullable
  email_change VARCHAR(255),            -- Nullable
  email_change_token_new VARCHAR(255),  -- Nullable
  recovery_token VARCHAR(255),          -- Nullable
  -- ...
);
```

This is likely for backward compatibility and flexibility, but the application layer requires them to be empty strings instead of NULL.

## Risks and Side Effects

### Minimal Risk
This is a **data-only migration** that does not alter table structure, constraints, or indexes. It only updates existing data.

### Potential Considerations

1. **Performance:** On large databases (millions of users), this UPDATE might take time
   - Consider running during low-traffic periods
   - The WHERE clause ensures only affected rows are updated

2. **Active Tokens:** If a user has an active recovery or confirmation process, the token is already set (not NULL), so it won't be affected

3. **Concurrent Operations:** PostgreSQL handles concurrent reads/writes safely
   - Brief row locks during update
   - No service interruption expected

4. **Audit Trail:** The migration doesn't create an audit trail of which users were affected
   - Consider logging affected user IDs if needed for compliance

## Official References

- **GitHub Discussion:** https://github.com/orgs/supabase/discussions/17106
- **Related Issue:** https://github.com/orgs/supabase/discussions/17106 (confirmation_token variant)
- **Auth Troubleshooting:** https://supabase.com/docs/guides/auth/troubleshooting

## Support

If you continue experiencing issues after applying this fix:

1. Check Supabase service status: https://status.supabase.com
2. Verify the migration was applied successfully
3. Check Supabase logs for any other errors
4. Contact Supabase support with:
   - Project reference
   - Error logs
   - Migration history

## Updates

**Last Updated:** 2025-11-17
**Supabase Version:** Compatible with all Supabase Auth versions using GoTrue
**Migration Version:** 20251117030000
