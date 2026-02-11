-- =====================================================
-- ZATTAR ADVOGADOS - USEFUL QUERIES FOR SCHEMA EXPORT
-- =====================================================
-- Execute these queries in Supabase SQL Editor to get complete DDL
-- =====================================================

-- =====================================================
-- 1. GET ALL FUNCTIONS WITH COMPLETE DEFINITIONS
-- =====================================================
-- This returns the complete CREATE FUNCTION statement for each function
SELECT
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind IN ('f', 'p')
ORDER BY p.proname;

-- =====================================================
-- 2. GET ALL TRIGGERS
-- =====================================================
SELECT
  'CREATE TRIGGER ' || t.tgname ||
  CASE
    WHEN t.tgtype & 2 = 2 THEN ' BEFORE'
    WHEN t.tgtype & 64 = 64 THEN ' INSTEAD OF'
    ELSE ' AFTER'
  END ||
  CASE
    WHEN t.tgtype & 4 = 4 THEN ' INSERT'
    WHEN t.tgtype & 8 = 8 THEN ' DELETE'
    WHEN t.tgtype & 16 = 16 THEN ' UPDATE'
    ELSE ''
  END ||
  ' ON public.' || c.relname ||
  ' FOR EACH ROW EXECUTE FUNCTION ' || p.proname || '();' as trigger_ddl
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;

-- =====================================================
-- 3. GET ALL RLS POLICIES WITH CREATE STATEMENTS
-- =====================================================
SELECT
  'CREATE POLICY "' || policyname || '" ON public.' || tablename ||
  ' AS ' || permissive ||
  ' FOR ' || cmd ||
  CASE
    WHEN roles::text != '{public}' THEN ' TO ' || array_to_string(roles, ', ')
    ELSE ''
  END ||
  CASE
    WHEN qual IS NOT NULL THEN ' USING (' || qual || ')'
    ELSE ''
  END ||
  CASE
    WHEN with_check IS NOT NULL THEN ' WITH CHECK (' || with_check || ')'
    ELSE ''
  END || ';' as policy_ddl
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- 4. ENABLE RLS ON ALL TABLES
-- =====================================================
SELECT
  'ALTER TABLE public.' || tablename || ' ENABLE ROW LEVEL SECURITY;' as enable_rls
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- 5. GET ALL SEQUENCES
-- =====================================================
SELECT
  'CREATE SEQUENCE public.' || sequence_name ||
  ' START WITH ' || start_value ||
  ' INCREMENT BY ' || increment || ';' as sequence_ddl
FROM information_schema.sequences
WHERE sequence_schema = 'public'
ORDER BY sequence_name;

-- =====================================================
-- 6. GET COMPLETE TABLE DDL (ALL COLUMNS WITH DETAILS)
-- =====================================================
SELECT
  'CREATE TABLE public.' || c.table_name || ' (' || E'\n  ' ||
  string_agg(
    c.column_name || ' ' ||
    CASE
      WHEN c.data_type = 'USER-DEFINED' THEN 'public.' || c.udt_name
      WHEN c.data_type = 'ARRAY' THEN REPLACE(c.udt_name, '_', '') || '[]'
      ELSE c.data_type
    END ||
    CASE WHEN c.character_maximum_length IS NOT NULL
      THEN '(' || c.character_maximum_length || ')'
      ELSE ''
    END ||
    CASE WHEN c.column_default IS NOT NULL
      THEN ' DEFAULT ' || c.column_default
      ELSE ''
    END ||
    CASE WHEN c.is_nullable = 'NO'
      THEN ' NOT NULL'
      ELSE ''
    END,
    ',' || E'\n  '
    ORDER BY c.ordinal_position
  ) || E'\n);' as create_table_ddl
FROM information_schema.columns c
WHERE c.table_schema = 'public'
GROUP BY c.table_name
ORDER BY c.table_name;

-- =====================================================
-- 7. GET ALL PRIMARY KEYS AND UNIQUE CONSTRAINTS
-- =====================================================
SELECT
  'ALTER TABLE public.' || tc.table_name ||
  ' ADD CONSTRAINT ' || tc.constraint_name ||
  CASE
    WHEN tc.constraint_type = 'PRIMARY KEY' THEN ' PRIMARY KEY ('
    WHEN tc.constraint_type = 'UNIQUE' THEN ' UNIQUE ('
  END ||
  string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) || ');' as constraint_ddl
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
  AND tc.table_name = kcu.table_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type
ORDER BY tc.table_name, tc.constraint_type DESC;

-- =====================================================
-- 8. GET ALL FOREIGN KEYS
-- =====================================================
SELECT
  'ALTER TABLE public.' || tc.table_name ||
  ' ADD CONSTRAINT ' || tc.constraint_name ||
  ' FOREIGN KEY (' || string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) || ')' ||
  ' REFERENCES public.' || ccu.table_name || ' (' ||
  string_agg(ccu.column_name, ', ' ORDER BY kcu.ordinal_position) || ')' ||
  CASE
    WHEN rc.delete_rule != 'NO ACTION' THEN ' ON DELETE ' || rc.delete_rule
    ELSE ''
  END ||
  CASE
    WHEN rc.update_rule != 'NO ACTION' THEN ' ON UPDATE ' || rc.update_rule
    ELSE ''
  END || ';' as fk_ddl
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints rc
  ON rc.constraint_name = tc.constraint_name
  AND rc.constraint_schema = tc.table_schema
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY'
GROUP BY tc.table_name, tc.constraint_name, ccu.table_name, rc.delete_rule, rc.update_rule
ORDER BY tc.table_name;

-- =====================================================
-- 9. GET ALL INDEXES (NON-CONSTRAINT INDEXES)
-- =====================================================
SELECT
  'CREATE INDEX ' || indexname || ' ON public.' || tablename ||
  ' USING ' || substring(indexdef from 'USING (\w+)') ||
  ' (' || substring(indexdef from '\(([^)]+)\)') || ');' as index_ddl
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname NOT LIKE '%_pkey'
  AND indexname NOT LIKE '%_key'
  AND indexdef NOT LIKE '%UNIQUE%'
ORDER BY tablename, indexname;

-- =====================================================
-- 10. GET ALL CHECK CONSTRAINTS
-- =====================================================
SELECT
  'ALTER TABLE public.' || tc.table_name ||
  ' ADD CONSTRAINT ' || tc.constraint_name ||
  ' CHECK ' || cc.check_clause || ';' as check_ddl
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
  AND tc.constraint_schema = cc.constraint_schema
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'CHECK'
ORDER BY tc.table_name, tc.constraint_name;

-- =====================================================
-- 11. GET ALL VIEWS
-- =====================================================
SELECT
  'CREATE OR REPLACE VIEW public.' || table_name || ' AS' || E'\n' ||
  view_definition || ';' as view_ddl
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- =====================================================
-- 12. GET ALL ENUM TYPES
-- =====================================================
SELECT
  'CREATE TYPE public.' || n.nspname || '.' || t.typname || ' AS ENUM (' ||
  string_agg('''' || e.enumlabel || '''', ', ' ORDER BY e.enumsortorder) ||
  ');' as enum_ddl
FROM pg_type t
JOIN pg_namespace n ON t.typnamespace = n.oid
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE n.nspname = 'public'
  AND t.typtype = 'e'
GROUP BY n.nspname, t.typname
ORDER BY t.typname;

-- =====================================================
-- 13. DATABASE STATISTICS SUMMARY
-- =====================================================
SELECT
  'Tables' as object_type,
  COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'public'
UNION ALL
SELECT
  'Views',
  COUNT(*)
FROM information_schema.views
WHERE table_schema = 'public'
UNION ALL
SELECT
  'Functions',
  COUNT(*)
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
UNION ALL
SELECT
  'Indexes',
  COUNT(*)
FROM pg_indexes
WHERE schemaname = 'public'
UNION ALL
SELECT
  'Constraints',
  COUNT(*)
FROM information_schema.table_constraints
WHERE table_schema = 'public';

-- =====================================================
-- 14. GET STORAGE BUCKET POLICIES (if using Supabase Storage)
-- =====================================================
SELECT
  'CREATE POLICY "' || name || '" ON storage.objects' ||
  ' FOR ' || operation ||
  ' TO ' || coalesce(array_to_string(roles, ', '), 'public') ||
  ' USING (' || definition || ');' as storage_policy
FROM storage.policies
ORDER BY bucket_id, name;

-- =====================================================
-- END OF USEFUL QUERIES
-- =====================================================
