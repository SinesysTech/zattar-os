#!/bin/bash

# =====================================================
# ZATTAR ADVOGADOS - DATABASE MIGRATION COMMANDS
# =====================================================
# This file contains ready-to-use commands for database migration
# Copy and paste these commands, replacing placeholders as needed
# =====================================================

# =====================================================
# SECTION 1: SUPABASE CLI COMMANDS
# =====================================================

# Install Supabase CLI (if not installed)
npm install -g supabase

# Initialize Supabase in your project
cd /path/to/zattar-advogados
supabase init

# Login to Supabase (opens browser)
supabase login

# Link to your CURRENT project
supabase link --project-ref YOUR_CURRENT_PROJECT_REF

# Pull complete schema from current project
supabase db pull
# Output: supabase/migrations/TIMESTAMP_remote_schema.sql

# Switch to NEW project
supabase link --project-ref YOUR_NEW_PROJECT_REF

# Push schema to new project
supabase db push

# Verify migration
supabase db diff

# Reset database if needed (WARNING: deletes all data)
supabase db reset

# =====================================================
# SECTION 2: PG_DUMP COMMANDS
# =====================================================

# Schema-only export
pg_dump \
  "postgresql://postgres:PASSWORD@HOST:5432/postgres" \
  --schema-only \
  --no-owner \
  --no-acl \
  --schema=public \
  --file=zattar_schema_only.sql

# Data-only export
pg_dump \
  "postgresql://postgres:PASSWORD@HOST:5432/postgres" \
  --data-only \
  --schema=public \
  --file=zattar_data_only.sql

# Complete export (schema + data)
pg_dump \
  "postgresql://postgres:PASSWORD@HOST:5432/postgres" \
  --no-owner \
  --no-acl \
  --schema=public \
  --file=zattar_complete.sql

# Import schema to new database
psql "postgresql://postgres:NEW_PASSWORD@NEW_HOST:5432/postgres" \
  --file=zattar_schema_only.sql

# Import data to new database
psql "postgresql://postgres:NEW_PASSWORD@NEW_HOST:5432/postgres" \
  --file=zattar_data_only.sql

# =====================================================
# SECTION 3: DIRECT PSQL COMMANDS
# =====================================================

# Connect to current database
psql "postgresql://postgres:PASSWORD@HOST:5432/postgres"

# Connect to new database
psql "postgresql://postgres:NEW_PASSWORD@NEW_HOST:5432/postgres"

# List all tables
\dt

# List all views
\dv

# List all functions
\df

# List all schemas
\dn

# Describe a table
\d table_name

# Quit psql
\q

# =====================================================
# SECTION 4: VERIFICATION COMMANDS
# =====================================================

# Count tables in current database
psql "postgresql://postgres:PASSWORD@HOST:5432/postgres" \
  -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"

# Count views
psql "postgresql://postgres:PASSWORD@HOST:5432/postgres" \
  -c "SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public';"

# Count functions
psql "postgresql://postgres:PASSWORD@HOST:5432/postgres" \
  -c "SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public';"

# Count indexes
psql "postgresql://postgres:PASSWORD@HOST:5432/postgres" \
  -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';"

# =====================================================
# SECTION 5: MAINTENANCE COMMANDS
# =====================================================

# Analyze all tables (update statistics)
psql "postgresql://postgres:PASSWORD@HOST:5432/postgres" \
  -c "ANALYZE;"

# Vacuum and analyze (cleanup + statistics)
psql "postgresql://postgres:PASSWORD@HOST:5432/postgres" \
  -c "VACUUM ANALYZE;"

# Reindex all tables
psql "postgresql://postgres:PASSWORD@HOST:5432/postgres" \
  -c "REINDEX DATABASE postgres;"

# Check database size
psql "postgresql://postgres:PASSWORD@HOST:5432/postgres" \
  -c "SELECT pg_size_pretty(pg_database_size('postgres'));"

# =====================================================
# SECTION 6: BACKUP COMMANDS
# =====================================================

# Create compressed backup (recommended for large databases)
pg_dump \
  "postgresql://postgres:PASSWORD@HOST:5432/postgres" \
  --format=custom \
  --file=zattar_backup_$(date +%Y%m%d_%H%M%S).dump

# Restore from compressed backup
pg_restore \
  --dbname="postgresql://postgres:NEW_PASSWORD@NEW_HOST:5432/postgres" \
  --no-owner \
  --no-acl \
  zattar_backup_20260210_143000.dump

# Create SQL backup with timestamp
pg_dump \
  "postgresql://postgres:PASSWORD@HOST:5432/postgres" \
  --file=zattar_backup_$(date +%Y%m%d_%H%M%S).sql

# =====================================================
# SECTION 7: USEFUL SQL QUERIES
# =====================================================

# Get database statistics
psql "postgresql://postgres:PASSWORD@HOST:5432/postgres" << 'EOF'
SELECT
  'Tables' as object_type,
  COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'public'
UNION ALL
SELECT 'Views', COUNT(*) FROM information_schema.views WHERE table_schema = 'public'
UNION ALL
SELECT 'Functions', COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public'
UNION ALL
SELECT 'Indexes', COUNT(*) FROM pg_indexes WHERE schemaname = 'public';
EOF

# Get table sizes
psql "postgresql://postgres:PASSWORD@HOST:5432/postgres" << 'EOF'
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;
EOF

# Check for missing indexes
psql "postgresql://postgres:PASSWORD@HOST:5432/postgres" << 'EOF'
SELECT
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 100
  AND correlation < 0.1
ORDER BY n_distinct DESC
LIMIT 20;
EOF

# =====================================================
# SECTION 8: ENVIRONMENT SETUP
# =====================================================

# Set environment variables for current database
export CURRENT_DB_URL="postgresql://postgres:PASSWORD@HOST:5432/postgres"

# Set environment variables for new database
export NEW_DB_URL="postgresql://postgres:NEW_PASSWORD@NEW_HOST:5432/postgres"

# Use environment variables in commands
pg_dump "$CURRENT_DB_URL" --schema-only --file=schema.sql
psql "$NEW_DB_URL" --file=schema.sql

# =====================================================
# SECTION 9: MIGRATION WORKFLOW (COMPLETE)
# =====================================================

# Step 1: Backup current database
echo "📦 Creating backup..."
pg_dump "$CURRENT_DB_URL" \
  --format=custom \
  --file=zattar_backup_$(date +%Y%m%d_%H%M%S).dump

# Step 2: Export schema only
echo "📋 Exporting schema..."
pg_dump "$CURRENT_DB_URL" \
  --schema-only \
  --no-owner \
  --no-acl \
  --schema=public \
  --file=zattar_schema.sql

# Step 3: Create new database structure
echo "🏗️  Creating structure in new database..."
psql "$NEW_DB_URL" --file=zattar_schema.sql

# Step 4: Export data (if needed)
echo "📊 Exporting data..."
pg_dump "$CURRENT_DB_URL" \
  --data-only \
  --schema=public \
  --file=zattar_data.sql

# Step 5: Import data
echo "⬆️  Importing data..."
psql "$NEW_DB_URL" --file=zattar_data.sql

# Step 6: Verify migration
echo "✅ Verifying migration..."
psql "$NEW_DB_URL" -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';"

# Step 7: Optimize new database
echo "⚡ Optimizing..."
psql "$NEW_DB_URL" -c "ANALYZE;"
psql "$NEW_DB_URL" -c "VACUUM ANALYZE;"

echo "✨ Migration complete!"

# =====================================================
# SECTION 10: TROUBLESHOOTING COMMANDS
# =====================================================

# Check for locks
psql "$CURRENT_DB_URL" << 'EOF'
SELECT
  pid,
  usename,
  application_name,
  client_addr,
  backend_start,
  state,
  query
FROM pg_stat_activity
WHERE datname = 'postgres'
  AND state != 'idle'
ORDER BY backend_start;
EOF

# Kill a specific connection (if stuck)
# psql "$CURRENT_DB_URL" -c "SELECT pg_terminate_backend(PID);"

# Check for long-running queries
psql "$CURRENT_DB_URL" << 'EOF'
SELECT
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query
FROM pg_stat_activity
WHERE state = 'active'
  AND now() - pg_stat_activity.query_start > interval '5 minutes'
ORDER BY duration DESC;
EOF

# Check replication lag (if using replication)
psql "$CURRENT_DB_URL" -c "SELECT * FROM pg_stat_replication;"

# =====================================================
# SECTION 11: PERFORMANCE MONITORING
# =====================================================

# Most frequently accessed tables
psql "$CURRENT_DB_URL" << 'EOF'
SELECT
  schemaname,
  tablename,
  seq_scan + idx_scan as total_scans,
  seq_scan,
  idx_scan
FROM pg_stat_user_tables
ORDER BY total_scans DESC
LIMIT 20;
EOF

# Cache hit ratio (should be > 99%)
psql "$CURRENT_DB_URL" << 'EOF'
SELECT
  sum(heap_blks_read) as heap_read,
  sum(heap_blks_hit) as heap_hit,
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
FROM pg_statio_user_tables;
EOF

# Index usage statistics
psql "$CURRENT_DB_URL" << 'EOF'
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC
LIMIT 20;
EOF

# =====================================================
# END OF COMMANDS REFERENCE
# =====================================================

# NOTES:
# - Replace PASSWORD, HOST, NEW_PASSWORD, NEW_HOST with actual values
# - Replace YOUR_CURRENT_PROJECT_REF and YOUR_NEW_PROJECT_REF with actual project IDs
# - Test commands in staging environment first
# - Always have a backup before running destructive operations
# - Monitor logs after migration for any errors
