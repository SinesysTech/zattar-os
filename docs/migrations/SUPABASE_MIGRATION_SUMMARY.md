# Supabase Migration Issues - Summary & Solutions

## Issues Found

### 1. Migration Naming Format
**Problem**: Several migrations used incorrect naming format
- ❌ `2025-12-06-create-conciliacao-bancaria-tables.sql`
- ✅ `20251206000000_create_conciliacao_bancaria_tables.sql`

**Status**: ✅ FIXED - All migrations renamed to correct format

### 2. Missing Base Schema
**Problem**: Migrations tried to ALTER tables that didn't exist yet
- `acervo` table referenced but never created in migrations
- Schema files in `supabase/schemas/` weren't being loaded

**Attempted Solution**: Created consolidated base migration from schema files
**Status**: ⚠️ PARTIAL - Dependency ordering issues remain

### 3. Dependency Ordering
**Problem**: Tables reference other tables that haven't been created yet
- `expedientes` (file 06) references `usuarios` (file 08)
- `acervo_unificado` view references `responsavel_id` column added in later migration

**Status**: ❌ NOT FULLY RESOLVED

### 4. Missing ENUMs
**Problem**: Schema files missing some ENUM definitions
- `origem_expediente` defined in migration but needed in base schema

**Status**: ✅ FIXED - All ENUMs extracted from `full_schema_dump.sql`

## Files Modified

### Migrations Renamed
- `2025-12-06-create-conciliacao-bancaria-tables.sql` → `20251206000000_create_conciliacao_bancaria_tables.sql`
- `2025-12-07-add-dados-adicionais-conciliacoes.sql` → `20251207000000_add_dados_adicionais_conciliacoes.sql`
- `2025-12-12-create-embeddings-system.sql` → `20251212000000_create_embeddings_system.sql`
- `2025-12-29-refactor-contratos-modelo-relacional.sql` → `20251229000000_refactor_contratos_modelo_relacional.sql`
- `add-tipo-captura-combinada.sql` → `20251125000010_add_tipo_captura_combinada.sql`
- `add_dados_anteriores_auditoria.sql` → `20260216130001_add_dados_anteriores_auditoria.sql`

### Migrations Disabled (Temporarily)
- `20250101000000_create_embeddings_conhecimento.sql` → `DISABLED_*`
- `20250101000001_add_timeline_jsonb_to_acervo.sql` → `DISABLED_*`

### New Files Created
- `supabase/migrations/20240101000000_base_schema.sql` - Consolidated base schema
- `fix-migrations.sh` - Script to rename migrations
- `create-final-base-migration.sh` - Script to create base migration

### Configuration Updated
- `supabase/config.toml` - Set `schema_paths = []` (using migration instead)

## Recommended Solutions

### Option 1: Use Production Database Dump (RECOMMENDED)
```bash
# 1. Get connection string from production Supabase project
# 2. Dump the schema
pg_dump "$PRODUCTION_DB_URL" --schema-only --no-owner --no-acl > supabase/migrations/00000000000000_production_schema.sql

# 3. Start Supabase
supabase start
```

### Option 2: Use Supabase CLI Pull (EASIEST)
```bash
# 1. Link to production project
supabase link --project-ref YOUR_PROJECT_REF

# 2. Pull schema
supabase db pull

# 3. Start local
supabase start
```

### Option 3: Fix Dependency Order (COMPLEX)
Requires rewriting schema files to:
1. Create all tables without foreign keys
2. Add foreign keys in a second pass
3. Create views last

## Current State

### What Works
- ✅ All migrations have correct naming format
- ✅ All ENUMs are defined
- ✅ Extensions are configured
- ✅ Most schema files are consolidated

### What Doesn't Work
- ❌ Foreign key dependency ordering
- ❌ Views depending on columns from later migrations
- ❌ Some ALTER-only schema files

## Next Steps

### Immediate Action (Choose One)

**A. Fresh Start with Production Dump**
```bash
# Stop current attempt
supabase stop

# Remove problematic base migration
rm supabase/migrations/20240101000000_base_schema.sql

# Get production schema (use Option 1 or 2 above)
# Then:
supabase start
```

**B. Continue with Current Approach**
```bash
# Manually fix dependency order in base migration
# Move usuarios table creation before expedientes
# Remove foreign keys, add them later
# This is time-consuming and error-prone
```

### Long-term Solution
1. Use `supabase db pull` regularly to keep local schema in sync
2. Don't manually edit schema files - use migrations only
3. Test migrations in staging before production

## Files to Review

- `supabase/migrations/20240101000000_base_schema.sql` - Current base migration (has issues)
- `supabase/schemas/` - Original schema files (reference only)
- `supabase/full_schema_dump.sql` - Complete ENUM definitions

## Scripts Created

- `fix-migrations.sh` - Rename incorrectly formatted migrations
- `create-base-migration.sh` - Create base from schemas (v1)
- `fix-base-migration.sh` - Fix base migration (v1)
- `fix-base-migration-v2.sh` - Fix base migration (v2)
- `create-final-base-migration.sh` - Final version with all ENUMs

## Contact

If you need help with any of these solutions, the recommended approach is:

1. Use `supabase db pull` from your production database
2. This will create properly ordered migrations
3. Then `supabase start` will work correctly

---

**Generated**: 2026-02-16
**Status**: Partial fix applied, dependency issues remain
