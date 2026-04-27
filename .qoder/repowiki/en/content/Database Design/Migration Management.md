# Migration Management

<cite>
**Referenced Files in This Document**
- [supabase/migrations/00000000000001_production_schema.sql](file://supabase/migrations/00000000000001_production_schema.sql)
- [supabase/migrations/20250118115831_create_agendamentos.sql](file://supabase/migrations/20250118115831_create_agendamentos.sql)
- [supabase/migrations/20251125000000_create_locks_table.sql](file://supabase/migrations/20251125000000_create_locks_table.sql)
- [supabase/migrations/20260324142329_add_resultado_decisao.sql](file://supabase/migrations/20260324142329_add_resultado_decisao.sql)
- [supabase/migrations/20260424140000_baixa_expediente_atomic.sql](file://supabase/migrations/20260424140000_baixa_expediente_atomic.sql)
- [supabase/migrations/20260427120000_fix_baixar_expediente_atomic_enum.sql](file://supabase/migrations/20260427120000_fix_baixar_expediente_atomic_enum.sql)
- [src/app/(authenticated)/expedientes/repository.ts](file://src/app/(authenticated)/expedientes/repository.ts)
- [src/app/(authenticated)/expedientes/domain.ts](file://src/app/(authenticated)/expedientes/domain.ts)
- [src/lib/supabase/database.types.ts](file://src/lib/supabase/database.types.ts)
- [scripts/database/apply-migrations-via-supabase-sdk.ts](file://scripts/database/apply-migrations-via-supabase-sdk.ts)
- [scripts/database/check-applied-migrations.ts](file://scripts/database/check-applied-migrations.ts)
- [scripts/database/migrations/apply-migration-sql.sh](file://scripts/database/migrations/apply-migration-sql.sh)
- [supabase/migrations/APPLY_MANUALLY_add_chatflow_to_dify_apps.sql](file://supabase/migrations/APPLY_MANUALLY_add_chatflow_to_dify_apps.sql)
- [supabase/migrations/DISABLED_20250101000000_create_embeddings_conhecimento.sql](file://supabase/migrations/DISABLED_20250101000000_create_embeddings_conhecimento.sql)
- [scripts/database/populate-database.ts](file://scripts/database/populate-database.ts)
- [scripts/database/reset-and-pull-migrations.sh](file://scripts/database/reset-and-pull-migrations.sh)
- [scripts/database/sync-migrations.sh](file://scripts/database/sync-migrations.sh)
- [scripts/database/organize-migrations.ts](file://scripts/database/organize-migrations.ts)
- [scripts/database/create-base-migration.sh](file://scripts/database/create-base-migration.sh)
- [scripts/database/create-final-base-migration.sh](file://scripts/database/create-final-base-migration.sh)
- [scripts/database/fix-migrations.sh](file://scripts/database/fix-migrations.sh)
- [scripts/database/apply-locks-migration.ts](file://scripts/database/apply-locks-migration.ts)
- [scripts/database/apply-rls-simple.ts](file://scripts/database/apply-rls-simple.ts)
- [scripts/database/dump-production-schema.sh](file://scripts/database/dump-production-schema.sh)
- [scripts/database/migrations/apply-migrations-manual.ts](file://scripts/database/migrations/apply-migrations-manual.ts)
- [supabase/QUICK_START.md](file://supabase/QUICK_START.md)
- [supabase/README.md](file://supabase/README.md)
- [supabase/SCHEMA_EXPORT_README.md](file://supabase/SCHEMA_EXPORT_README.md)
- [supabase/useful_queries.sql](file://supabase/useful_queries.sql)
- [supabase/full_schema_dump.sql](file://supabase/full_schema_dump.sql)
- [scripts/database/README.md](file://scripts/database/README.md)
</cite>

## Update Summary
**Changes Made**
- Added comprehensive documentation for the `baixar_expediente_atomic` function migration corrections
- Updated TypeScript integration documentation to reflect enum parameter type alignment
- Enhanced migration validation procedures with enum casting considerations
- Added detailed examples of enum-based function signatures and type safety
- Updated troubleshooting guidance for enum-related migration failures

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document describes the ZattarOS database evolution system built on Supabase. It explains how migrations are organized, named, and executed; how to create and maintain them; and how to validate, rollback, and troubleshoot them safely. It also covers production deployment workflows, shadow database usage, and testing procedures.

**Updated** Added comprehensive coverage of enum parameter type alignment for database functions, particularly focusing on the `baixar_expediente_atomic` function migration corrections and TypeScript integration patterns.

## Project Structure
ZattarOS organizes database migrations under the Supabase project directory with two primary categories:
- supabase/migrations: SQL migration files that evolve the schema and data model
- scripts/database/migrations: TypeScript and shell scripts that automate migration application, verification, and maintenance

```mermaid
graph TB
subgraph "Supabase Project"
A["supabase/migrations<br/>SQL migration files"]
B["supabase/schemas<br/>Schema modules"]
C["supabase/functions<br/>Custom functions"]
end
subgraph "Automation Scripts"
D["scripts/database/*.ts<br/>Migration runners & validators"]
E["scripts/database/migrations/*.sh<br/>Manual SQL helpers"]
end
A --> D
D --> |"Executes"| A
D --> |"Validates"| A
E --> |"Displays SQL for manual run"| A
```

**Diagram sources**
- [supabase/migrations/00000000000001_production_schema.sql:1-50](file://supabase/migrations/00000000000001_production_schema.sql#L1-L50)
- [scripts/database/apply-migrations-via-supabase-sdk.ts:1-162](file://scripts/database/apply-migrations-via-supabase-sdk.ts#L1-L162)
- [scripts/database/migrations/apply-migration-sql.sh:1-23](file://scripts/database/migrations/apply-migration-sql.sh#L1-L23)

**Section sources**
- [supabase/migrations/00000000000001_production_schema.sql:1-120](file://supabase/migrations/00000000000001_production_schema.sql#L1-L120)
- [scripts/database/apply-migrations-via-supabase-sdk.ts:1-162](file://scripts/database/apply-migrations-via-supabase-sdk.ts#L1-L162)
- [scripts/database/migrations/apply-migration-sql.sh:1-23](file://scripts/database/migrations/apply-migration-sql.sh#L1-L23)

## Core Components
- Migration files: SQL scripts under supabase/migrations with strict naming conventions and sequential ordering.
- Migration runners: TypeScript scripts that apply, validate, and manage migrations programmatically.
- Manual SQL helpers: Shell scripts that print SQL for manual execution in the Supabase Dashboard.
- Schema modules: Modular SQL files under supabase/schemas that define logical units of the schema.

Key responsibilities:
- Naming and ordering: Ensures deterministic execution order.
- Validation: Confirms applied vs pending migrations.
- Execution: Applies migrations via Supabase SDK or manual SQL.
- Rollback and safety: Provides rollback comments and disabled markers for future use.
- Type safety: Maintains proper enum parameter alignment between database functions and TypeScript integration.

**Updated** Enhanced type safety validation for enum parameters in database functions, particularly for atomic operations like `baixar_expediente_atomic`.

**Section sources**
- [supabase/migrations/20250118115831_create_agendamentos.sql:1-77](file://supabase/migrations/20250118115831_create_agendamentos.sql#L1-L77)
- [supabase/migrations/20251125000000_create_locks_table.sql:1-77](file://supabase/migrations/20251125000000_create_locks_table.sql#L1-L77)
- [scripts/database/check-applied-migrations.ts:1-223](file://scripts/database/check-applied-migrations.ts#L1-L223)
- [scripts/database/apply-migrations-via-supabase-sdk.ts:1-162](file://scripts/database/apply-migrations-via-supabase-sdk.ts#L1-L162)

## Architecture Overview
The migration lifecycle integrates Supabase's platform capabilities with local automation scripts:

```mermaid
sequenceDiagram
participant Dev as "Developer"
participant TS as "Migration Runner (TS)"
participant Supabase as "Supabase Platform"
participant DB as "PostgreSQL"
Dev->>TS : Run migration script
TS->>TS : Parse migration file(s)
TS->>Supabase : Send SQL statements via REST RPC
Supabase->>DB : Execute DDL/DML
DB-->>Supabase : Results
Supabase-->>TS : Status
TS-->>Dev : Summary and next steps
```

**Diagram sources**
- [scripts/database/apply-migrations-via-supabase-sdk.ts:39-116](file://scripts/database/apply-migrations-via-supabase-sdk.ts#L39-L116)
- [supabase/migrations/20251125000000_create_locks_table.sql:1-77](file://supabase/migrations/20251125000000_create_locks_table.sql#L1-L77)

## Detailed Component Analysis

### Migration File Organization and Naming Conventions
- Base schema: A foundational migration initializes extensions, enums, schema, and core functions.
- Feature migrations: Named with a timestamp prefix followed by a descriptive slug, ensuring chronological ordering.
- Special markers:
  - APPLY_MANUALLY: Indicates migrations requiring manual intervention in the dashboard.
  - DISABLED: Marks migrations that are intentionally skipped or deferred.

Examples:
- Base schema: [supabase/migrations/00000000000001_production_schema.sql:1-120](file://supabase/migrations/00000000000001_production_schema.sql#L1-L120)
- Feature migration: [supabase/migrations/20250118115831_create_agendamentos.sql:1-77](file://supabase/migrations/20250118115831_create_agendamentos.sql#L1-L77)
- Manual-only: [supabase/migrations/APPLY_MANUALLY_add_chatflow_to_dify_apps.sql](file://supabase/migrations/APPLY_MANUALLY_add_chatflow_to_dify_apps.sql)
- Disabled: [supabase/migrations/DISABLED_20250101000000_create_embeddings_conhecimento.sql](file://supabase/migrations/DISABLED_20250101000000_create_embeddings_conhecimento.sql)

Sequential execution order:
- Deterministic by filename sorting.
- Base schema runs first, followed by feature migrations in timestamp order.

**Section sources**
- [supabase/migrations/00000000000001_production_schema.sql:1-120](file://supabase/migrations/00000000000001_production_schema.sql#L1-L120)
- [supabase/migrations/20250118115831_create_agendamentos.sql:1-77](file://supabase/migrations/20250118115831_create_agendamentos.sql#L1-L77)
- [supabase/migrations/APPLY_MANUALLY_add_chatflow_to_dify_apps.sql](file://supabase/migrations/APPLY_MANUALLY_add_chatflow_to_dify_apps.sql)
- [supabase/migrations/DISABLED_20250101000000_create_embeddings_conhecimento.sql](file://supabase/migrations/DISABLED_20250101000000_create_embeddings_conhecimento.sql)

### Database Function Migration Patterns: Enum Parameter Alignment

**Updated** The `baixar_expediente_atomic` function demonstrates critical enum parameter type alignment requirements between database functions and TypeScript integration.

#### Enum-Based Function Signatures
The atomic expedition functions showcase proper enum parameter handling:

```sql
-- Original function with text parameter (problematic)
create or replace function public.baixar_expediente_atomic(
  p_expediente_id bigint,
  p_usuario_id bigint,
  p_protocolo_id text default null,
  p_justificativa text default null,
  p_baixado_em timestamptz default null,
  p_resultado_decisao text default null  -- ❌ Text parameter
)

-- Corrected function with enum parameter (fixed)
create function public.baixar_expediente_atomic(
  p_expediente_id bigint,
  p_usuario_id bigint,
  p_protocolo_id text default null,
  p_justificativa text default null,
  p_baixado_em timestamptz default null,
  p_resultado_decisao public.resultado_decisao_enum default null  -- ✅ Enum parameter
)
```

#### TypeScript Integration Alignment
The TypeScript repository layer maintains type safety through enum alignment:

```typescript
// Domain enum definition
export enum ResultadoDecisao {
  DESFAVORAVEL = "desfavoravel",
  PARCIALMENTE_FAVORAVEL = "parcialmente_favoravel",
  FAVORAVEL = "favoravel",
}

// Repository RPC call with proper enum typing
const { data, error } = await db.rpc("baixar_expediente_atomic", {
  p_expediente_id: id,
  p_usuario_id: usuarioId,
  p_protocolo_id: dados.protocoloId ?? null,
  p_justificativa: dados.justificativaBaixa ?? null,
  p_baixado_em: dados.baixadoEm ?? null,
  p_resultado_decisao: dados.resultadoDecisao ?? null, // ✅ Properly typed
});
```

#### Generated TypeScript Types
The Supabase client generates strongly-typed function signatures:

```typescript
// Generated database.types.ts
baixar_expediente_atomic: {
  Args: {
    p_baixado_em?: string
    p_expediente_id: number
    p_justificativa?: string
    p_protocolo_id?: string
    p_resultado_decisao?: Database["public"]["Enums"]["resultado_decisao_enum"] // ✅ Enum type
    p_usuario_id: number
  }
  Returns: Json
}
```

**Section sources**
- [supabase/migrations/20260324142329_add_resultado_decisao.sql:1-84](file://supabase/migrations/20260324142329_add_resultado_decisao.sql#L1-L84)
- [supabase/migrations/20260424140000_baixa_expediente_atomic.sql:1-125](file://supabase/migrations/20260424140000_baixa_expediente_atomic.sql#L1-L125)
- [supabase/migrations/20260427120000_fix_baixar_expediente_atomic_enum.sql:1-67](file://supabase/migrations/20260427120000_fix_baixar_expediente_atomic_enum.sql#L1-L67)
- [src/app/(authenticated)/expedientes/repository.ts:556-598](file://src/app/(authenticated)/expedientes/repository.ts#L556-L598)
- [src/app/(authenticated)/expedientes/domain.ts:60-70](file://src/app/(authenticated)/expedientes/domain.ts#L60-L70)
- [src/lib/supabase/database.types.ts:8900-8912](file://src/lib/supabase/database.types.ts#L8900-L8912)

### Migration Creation Process Using Supabase CLI and Custom Scripts
- Supabase CLI: Use the CLI to scaffold and manage migrations within the Supabase project context.
- Local scripts:
  - Manual SQL helper: Prints migration SQL for dashboard execution.
  - Migration runner: Applies SQL statements programmatically via REST RPC.
  - Validators: Confirm applied vs pending migrations by checking schema objects.

Recommended workflow:
- Create base schema and feature migrations locally.
- Use the manual SQL helper to review and execute targeted migrations in the dashboard when needed.
- Use the migration runner for automated application in CI/CD or staging environments.

**Section sources**
- [scripts/database/migrations/apply-migration-sql.sh:1-23](file://scripts/database/migrations/apply-migration-sql.sh#L1-L23)
- [scripts/database/apply-migrations-via-supabase-sdk.ts:1-162](file://scripts/database/apply-migrations-via-supabase-sdk.ts#L1-L162)
- [supabase/QUICK_START.md](file://supabase/QUICK_START.md)
- [supabase/README.md](file://supabase/README.md)

### Rollback Strategies and Conflict Resolution
Rollback indicators in migration files:
- Rollback comments: Provide step-by-step DROP statements for tables, functions, and indexes.
- Example: [supabase/migrations/20251125000000_create_locks_table.sql:65-77](file://supabase/migrations/20251125000000_create_locks_table.sql#L65-L77)

Conflict resolution patterns:
- Use IF NOT EXISTS checks to avoid errors when re-applying idempotent statements.
- Ignore benign errors (e.g., "already exists") during automated application.
- For non-idempotent changes, rely on rollback comments to revert safely.
- **Updated** For enum parameter changes, use DROP + CREATE pattern to modify function signatures safely.

**Section sources**
- [supabase/migrations/20251125000000_create_locks_table.sql:65-77](file://supabase/migrations/20251125000000_create_locks_table.sql#L65-L77)
- [scripts/database/apply-migrations-via-supabase-sdk.ts:102-108](file://scripts/database/apply-migrations-via-supabase-sdk.ts#L102-L108)

### Testing Procedures and Validation
Validation pipeline:
- Automated check: [scripts/database/check-applied-migrations.ts:131-148](file://scripts/database/check-applied-migrations.ts#L131-L148) verifies presence of tables/columns and writes a status report.
- Manual verification: Use Supabase Dashboard to inspect schema state after applying migrations.
- Utility resources: [supabase/useful_queries.sql](file://supabase/useful_queries.sql) and [supabase/full_schema_dump.sql](file://supabase/full_schema_dump.sql) support inspection and comparison.

**Updated** Enhanced validation for enum parameter types in database functions:
- Verify enum type definitions exist in both database and TypeScript definitions
- Test function signature alignment using generated database.types.ts
- Validate RPC calls with proper enum values in integration tests

Testing checklist:
- Confirm applied vs pending migrations.
- Verify RLS policies and triggers are active.
- Validate indexes and performance-related changes.
- **Updated** Validate enum parameter types align between database functions and TypeScript integration.
- Cross-check against production schema dumps.

**Section sources**
- [scripts/database/check-applied-migrations.ts:1-223](file://scripts/database/check-applied-migrations.ts#L1-L223)
- [supabase/useful_queries.sql](file://supabase/useful_queries.sql)
- [supabase/full_schema_dump.sql](file://supabase/full_schema_dump.sql)

### Production Deployment Workflow
Production-grade practices:
- Shadow database: Use a separate Supabase project for pre-flight validation before applying to production.
- Controlled rollout: Apply migrations in small batches with validation between steps.
- Backup and rollback: Keep rollback comments and consider snapshot backups prior to major schema changes.
- Post-deploy verification: Run the validation script and review metrics.

Operational scripts:
- Reset and pull: [scripts/database/reset-and-pull-migrations.sh](file://scripts/database/reset-and-pull-migrations.sh)
- Sync migrations: [scripts/database/sync-migrations.sh](file://scripts/database/sync-migrations.sh)
- Populate database: [scripts/database/populate-database.ts](file://scripts/database/populate-database.ts)

**Section sources**
- [scripts/database/reset-and-pull-migrations.sh](file://scripts/database/reset-and-pull-migrations.sh)
- [scripts/database/sync-migrations.sh](file://scripts/database/sync-migrations.sh)
- [scripts/database/populate-database.ts](file://scripts/database/populate-database.ts)

### Migration Validation and Compliance
- Enum and type definitions: Centralized in the base schema for consistency across migrations.
- RLS and grants: Enforce row-level security and least-privilege access in feature migrations.
- Function coverage: Core functions are defined in the base schema and referenced by later migrations.
- **Updated** Enum parameter validation: Ensure database function parameters match TypeScript enum definitions for type-safe integration.

**Section sources**
- [supabase/migrations/00000000000001_production_schema.sql:32-120](file://supabase/migrations/00000000000001_production_schema.sql#L32-L120)
- [supabase/migrations/20250118115831_create_agendamentos.sql:50-77](file://supabase/migrations/20250118115831_create_agendamentos.sql#L50-L77)

### Common Migration Patterns and Anti-Patterns
Patterns:
- Idempotent DDL: Use IF NOT EXISTS and defensive checks.
- Incremental changes: Small, focused migrations with clear descriptions.
- RLS-first: Enable row-level security early and define policies alongside schema changes.
- Index hygiene: Add indexes alongside data volume increases; remove unused indexes post-merge.
- **Updated** Enum parameter alignment: Ensure database function parameters match TypeScript enum definitions for type safety.

Anti-patterns:
- Large monolithic migrations: Break into smaller, reversible steps.
- Unsafe assumptions: Avoid relying on implicit schema state; explicitly check and assert.
- Ignoring RLS: Always enforce row-level security for sensitive tables.
- No rollback comments: Include DROP statements and comments for future maintainers.
- **Updated** Enum type mismatches: Never mismatch enum parameters between database functions and TypeScript integration.

**Section sources**
- [supabase/migrations/20251125000000_create_locks_table.sql:65-77](file://supabase/migrations/20251125000000_create_locks_table.sql#L65-L77)
- [supabase/migrations/20250118115831_create_agendamentos.sql:37-48](file://supabase/migrations/20250118115831_create_agendamentos.sql#L37-L48)

## Dependency Analysis
The migration system exhibits low coupling between files, with clear separation of concerns:
- Migration files depend on the base schema and each other via timestamp ordering.
- Automation scripts depend on environment variables and the Supabase REST API.
- Manual helpers depend on the presence of specific migration files.
- **Updated** TypeScript integration depends on proper enum parameter alignment for database function calls.

```mermaid
graph LR
M1["20250118115831_create_agendamentos.sql"] --> B["00000000000001_production_schema.sql"]
M2["20251125000000_create_locks_table.sql"] --> B
M3["20260324142329_add_resultado_decisao.sql"] --> B
M4["20260424140000_baixa_expediente_atomic.sql"] --> M3
M5["20260427120000_fix_baixar_expediente_atomic_enum.sql"] --> M4
TS["apply-migrations-via-supabase-sdk.ts"] --> M1
TS --> M2
TS --> M3
TS --> M4
TS --> M5
VAL["check-applied-migrations.ts"] --> M1
VAL --> M2
VAL --> M3
VAL --> M4
VAL --> M5
SH["apply-migration-sql.sh"] --> M1
DOM["domain.ts (enum)"] --> REPO["repository.ts (RPC calls)"]
REPO --> DBTYPES["database.types.ts (generated)"]
```

**Diagram sources**
- [supabase/migrations/00000000000001_production_schema.sql:1-120](file://supabase/migrations/00000000000001_production_schema.sql#L1-L120)
- [supabase/migrations/20250118115831_create_agendamentos.sql:1-77](file://supabase/migrations/20250118115831_create_agendamentos.sql#L1-L77)
- [supabase/migrations/20251125000000_create_locks_table.sql:1-77](file://supabase/migrations/20251125000000_create_locks_table.sql#L1-L77)
- [supabase/migrations/20260324142329_add_resultado_decisao.sql:1-84](file://supabase/migrations/20260324142329_add_resultado_decisao.sql#L1-L84)
- [supabase/migrations/20260424140000_baixa_expediente_atomic.sql:1-125](file://supabase/migrations/20260424140000_baixa_expediente_atomic.sql#L1-L125)
- [supabase/migrations/20260427120000_fix_baixar_expediente_atomic_enum.sql:1-67](file://supabase/migrations/20260427120000_fix_baixar_expediente_atomic_enum.sql#L1-L67)
- [scripts/database/apply-migrations-via-supabase-sdk.ts:1-162](file://scripts/database/apply-migrations-via-supabase-sdk.ts#L1-L162)
- [scripts/database/check-applied-migrations.ts:1-223](file://scripts/database/check-applied-migrations.ts#L1-L223)
- [scripts/database/migrations/apply-migration-sql.sh:1-23](file://scripts/database/migrations/apply-migration-sql.sh#L1-L23)
- [src/app/(authenticated)/expedientes/domain.ts:60-70](file://src/app/(authenticated)/expedientes/domain.ts#L60-L70)
- [src/app/(authenticated)/expedientes/repository.ts:556-598](file://src/app/(authenticated)/expedientes/repository.ts#L556-L598)
- [src/lib/supabase/database.types.ts:8900-8912](file://src/lib/supabase/database.types.ts#L8900-L8912)

**Section sources**
- [scripts/database/apply-migrations-via-supabase-sdk.ts:1-162](file://scripts/database/apply-migrations-via-supabase-sdk.ts#L1-L162)
- [scripts/database/check-applied-migrations.ts:1-223](file://scripts/database/check-applied-migrations.ts#L1-L223)

## Performance Considerations
- Use indexes introduced by migrations to improve query performance.
- Monitor disk I/O and query performance using Supabase diagnostics and the provided scripts.
- Keep migrations minimal and incremental to reduce downtime and risk.
- **Updated** Consider enum parameter performance implications for frequently called functions like `baixar_expediente_atomic`.

## Troubleshooting Guide
Common issues and resolutions:
- Migration fails due to existing resources: The runner ignores benign "already exists" errors and continues. Review the failure output and apply rollback comments if necessary.
- RLS or grants missing: Re-run the RLS application script and confirm policies.
- Manual-only migrations: Use the SQL helper to copy and paste the SQL into the Supabase Dashboard.
- **Updated** Enum parameter type errors: When encountering "column is of type enum but expression is of type text" errors, ensure the database function parameter type matches the TypeScript enum definition and apply the appropriate migration fix.

**Updated** Specific troubleshooting for enum parameter issues:
- Error: "column 'resultado_decisao' is of type public.resultado_decisao_enum but expression is of type text"
- Cause: Function parameter type mismatch between database and TypeScript
- Solution: Apply the fix migration that changes parameter type from `text` to `public.resultado_decisao_enum`
- Verification: Check that `database.types.ts` reflects the enum type in the generated function signature

Diagnostic resources:
- Disk I/O diagnostics: [scripts/database/README.md:1-37](file://scripts/database/README.md#L1-L37)
- Useful queries: [supabase/useful_queries.sql](file://supabase/useful_queries.sql)
- Full schema dump: [supabase/full_schema_dump.sql](file://supabase/full_schema_dump.sql)

**Section sources**
- [scripts/database/apply-migrations-via-supabase-sdk.ts:94-108](file://scripts/database/apply-migrations-via-supabase-sdk.ts#L94-L108)
- [scripts/database/apply-rls-simple.ts](file://scripts/database/apply-rls-simple.ts)
- [scripts/database/README.md:1-37](file://scripts/database/README.md#L1-L37)
- [supabase/useful_queries.sql](file://supabase/useful_queries.sql)
- [supabase/full_schema_dump.sql](file://supabase/full_schema_dump.sql)

## Conclusion
ZattarOS employs a disciplined migration strategy combining timestamped SQL migrations, automated runners, and manual dashboards. By following the naming conventions, validation steps, and rollback practices outlined here, teams can evolve the database safely and predictably across development, staging, and production environments.

**Updated** The recent enum parameter alignment improvements for the `baixar_expediente_atomic` function demonstrate the importance of maintaining type consistency between database functions and TypeScript integration, ensuring robust, type-safe operations for atomic database transactions.

## Appendices

### Migration Checklist
- [ ] Migration file follows naming convention and timestamp ordering.
- [ ] Includes idempotent DDL and rollback comments.
- [ ] Validates RLS and grants.
- [ ] Adds indexes and constraints as needed.
- [ ] Tested in staging with validation script.
- [ ] Verified in shadow database before production.
- [ ] Documented impact and rollback procedure.
- **Updated** Verified enum parameter type alignment between database functions and TypeScript integration.

### Best Practices for Schema Changes
- Keep migrations small and focused.
- Use descriptive filenames and comments.
- Define RLS policies alongside schema changes.
- Add indexes proactively; remove unused ones post-merge.
- Back up before applying large migrations.
- **Updated** Maintain enum parameter type consistency across database functions and TypeScript integration layers.
- **Updated** Use DROP + CREATE pattern for function signature changes rather than CREATE OR REPLACE when modifying parameter types.

### TypeScript Integration Guidelines for Database Functions
- Ensure enum parameter types in database functions match TypeScript enum definitions
- Verify generated `database.types.ts` reflects correct enum types
- Test RPC calls with proper enum values in integration tests
- Validate function signatures through generated type definitions before deployment

**Section sources**
- [supabase/migrations/20260427120000_fix_baixar_expediente_atomic_enum.sql:18-24](file://supabase/migrations/20260427120000_fix_baixar_expediente_atomic_enum.sql#L18-L24)
- [src/lib/supabase/database.types.ts:8907-8910](file://src/lib/supabase/database.types.ts#L8907-L8910)
- [src/app/(authenticated)/expedientes/repository.ts:570-577](file://src/app/(authenticated)/expedientes/repository.ts#L570-L577)