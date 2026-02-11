# Quick Start - Recreating Zattar Advogados Database

## TL;DR - Fastest Method

```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Initialize and link to your NEW project
supabase init
supabase link --project-ref YOUR_NEW_PROJECT_REF

# 3. Pull schema from CURRENT project
# (Set connection string to current project temporarily)
supabase db pull

# 4. Apply to new project
# (Update connection string to new project)
supabase db push
```

## What Was Generated

This export captured:

### ✅ Fully Exported
- **10 Extensions** (uuid-ossp, pg_trgm, vector, etc.)
- **40+ ENUMs** (All custom types)
- **103 Tables** (Structure captured)
- **150+ Primary Keys & Unique Constraints**
- **150+ Foreign Keys**
- **400+ Indexes**
- **3 Views** (Full definitions)

### ⚠️ Partially Captured
- **50+ Functions** (Sample provided, use CLI for complete)
- **100+ Triggers** (Sample provided, use CLI for complete)
- **100+ RLS Policies** (Sample provided, use CLI for complete)

### ❌ Not Included
- **Data** (Only schema, no rows)
- **Storage Buckets** (Configure manually)
- **Auth Providers** (Configure in Dashboard)
- **Edge Functions** (Separate deployment)

## Files in This Directory

1. **`full_schema_dump.sql`** - Template showing structure (ENUMs, Views, basic schema)
2. **`useful_queries.sql`** - 14 ready-to-use queries for getting complete DDL
3. **`SCHEMA_EXPORT_README.md`** - Comprehensive documentation
4. **`QUICK_START.md`** - This file

## Option 1: Use Supabase CLI (Recommended)

### Step 1: Install CLI
```bash
npm install -g supabase
```

### Step 2: Link to Current Project
```bash
cd /path/to/zattar-advogados
supabase init
supabase link --project-ref YOUR_CURRENT_PROJECT_REF
```

### Step 3: Pull Complete Schema
```bash
supabase db pull
# This creates: supabase/migrations/TIMESTAMP_remote_schema.sql
```

### Step 4: Apply to New Project
```bash
# Update your .env or supabase config to point to new project
supabase link --project-ref YOUR_NEW_PROJECT_REF
supabase db push
```

## Option 2: Manual SQL Execution

### Step 1: Create New Supabase Project
Go to https://supabase.com/dashboard and create a new project.

### Step 2: Execute in Order
Run these in Supabase SQL Editor:

1. Execute all extension creations from `full_schema_dump.sql`
2. Execute all ENUM creations from `full_schema_dump.sql`
3. Run query #6 from `useful_queries.sql` to get all table DDLs
4. Run query #7 from `useful_queries.sql` for PRIMARY KEYS
5. Run query #8 from `useful_queries.sql` for FOREIGN KEYS
6. Run query #9 from `useful_queries.sql` for INDEXES
7. Run query #11 from `useful_queries.sql` for VIEWS
8. Run query #1 from `useful_queries.sql` for FUNCTIONS
9. Run query #2 from `useful_queries.sql` for TRIGGERS
10. Run query #3 from `useful_queries.sql` for RLS POLICIES
11. Run query #4 from `useful_queries.sql` to enable RLS on all tables

### Step 3: Verify
```sql
-- Run query #13 from useful_queries.sql
-- Should show: 103 tables, 3 views, 50+ functions, 400+ indexes
```

## Option 3: pg_dump

```bash
# From your current database
pg_dump \
  "postgresql://postgres:[password]@[host]:5432/postgres" \
  --schema-only \
  --no-owner \
  --no-acl \
  --schema=public \
  > complete_schema.sql

# Apply to new database
psql "postgresql://postgres:[password]@[new-host]:5432/postgres" < complete_schema.sql
```

## Critical Post-Migration Steps

### 1. Update Environment Variables
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://NEW-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=NEW_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=NEW_SERVICE_ROLE_KEY
```

### 2. Configure Storage Buckets
In Supabase Dashboard:
- Create `documents` bucket (private)
- Create `uploads` bucket (private)
- Configure storage policies

### 3. Configure Authentication
In Supabase Dashboard > Authentication:
- Enable Email/Password provider
- Configure email templates
- Set up redirect URLs

### 4. Link Users Table
Ensure `usuarios.auth_user_id` references `auth.users.id`

### 5. Verify RLS
Test that Row Level Security works correctly:
```sql
-- Test as authenticated user
SELECT * FROM acervo LIMIT 1;
```

## Testing Checklist

After migration, verify:

- [ ] Can connect from Next.js app
- [ ] Can query all tables
- [ ] Foreign keys enforce referential integrity
- [ ] RLS policies block unauthorized access
- [ ] Functions execute without errors
- [ ] Triggers fire correctly
- [ ] Views return data
- [ ] Indexes improve query performance
- [ ] File uploads work
- [ ] Authentication works

## Data Migration (If Needed)

### Export Data
```bash
pg_dump \
  "postgresql://postgres:[password]@[old-host]:5432/postgres" \
  --data-only \
  --schema=public \
  > data_only.sql
```

### Import Data
```bash
psql "postgresql://postgres:[password]@[new-host]:5432/postgres" < data_only.sql
```

### Or Use Supabase Studio
1. Go to Table Editor
2. Export table data as CSV
3. Import CSV in new project

## Common Issues

### Issue: "relation already exists"
**Solution**: Drop and recreate, or use `CREATE TABLE IF NOT EXISTS`

### Issue: "type does not exist"
**Solution**: Create ENUMs before tables

### Issue: "foreign key constraint"
**Solution**: Create parent tables before child tables

### Issue: "RLS policy blocks access"
**Solution**: Temporarily disable RLS or create proper policies

### Issue: "function not found"
**Solution**: Create functions before triggers that use them

## Performance Optimization

After migration:

1. **Analyze Tables**
   ```sql
   ANALYZE;
   ```

2. **Reindex**
   ```sql
   REINDEX DATABASE postgres;
   ```

3. **Update Statistics**
   ```sql
   VACUUM ANALYZE;
   ```

## Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **This Project's README**: `SCHEMA_EXPORT_README.md`
- **Useful Queries**: `useful_queries.sql`

## Estimated Time

- **CLI Method**: 10-15 minutes
- **Manual Method**: 1-2 hours
- **pg_dump Method**: 15-30 minutes
- **Data Migration**: +30-60 minutes (if needed)

## Final Notes

1. **Always test in staging first**
2. **Backup current database before migration**
3. **Use transactions when possible**
4. **Verify data integrity after migration**
5. **Update application configs immediately**

---

**Need Help?**
Review the complete documentation in `SCHEMA_EXPORT_README.md`
