# GEMINI.md

This file provides guidance to Gemini CLI when working with code in this repository.

## Project

Sinesys (Zattar OS) — legal management system (gestao juridica) for a Brazilian law firm.
Codebase is primarily in Portuguese (variable names, business terms, UI labels).

**Stack**: Next.js 16 (App Router, Turbopack), React 19, TypeScript 5 (strict), Supabase (PostgreSQL + RLS + pgvector), Tailwind CSS 4, shadcn/ui (new-york style)

**Node**: >= 22.0.0, npm >= 10

## Commands

```bash
# Development
npm run dev                    # Turbopack dev server
npm run type-check             # TypeScript validation (run before commits)

# Build
npm run build                  # Standard build
npm run build:ci               # CI/Docker build (higher heap)

# Testing
npm test                       # All tests (Jest 30)
npm run test:unit              # Unit tests
npm run test:e2e               # Playwright E2E
npx jest path/to/file.test.ts  # Single test file

# Validation
npm run lint                   # ESLint
npm run check:architecture     # FSD import validation
npm run validate:exports       # Barrel export validation
```

## Architecture

Feature-Sliced Design (FSD) with Domain-Driven Design (DDD). 42 feature modules in `src/features/`.

```
src/
  app/            # Next.js App Router (app/, api/, portal/)
  features/       # Feature modules (domain/service/repository/actions)
  components/     # UI: ui/ (shadcn), shared/ (patterns), layout/
  lib/            # Infrastructure (supabase, redis, ai, mcp, auth)
  hooks/          # Global hooks
  types/          # Shared types (database.types.ts is auto-generated)
```

### Feature module structure

Each feature follows **Domain -> Service -> Repository -> Actions**:

```
src/features/{module}/
  domain.ts       # Zod schemas, types, constants, business rules
  service.ts      # Use cases, business logic orchestration
  repository.ts   # Supabase data access
  actions/        # Server Actions (authenticatedAction wrapper)
  components/     # React components grouped by entity
  index.ts        # Barrel exports (MANDATORY)
```

### Data flow

```
UI -> Server Action (authenticatedAction + Zod) -> service -> repository (Supabase) -> revalidatePath
Returns: { success: boolean; data?: T; error?: string }
```

## Key Rules

### Import constraints (ESLint-enforced)

```typescript
// CORRECT — barrel exports
import { ClientesTable, actionListarClientes } from "@/features/partes";

// WRONG — no deep imports
import { ClientesTable } from "@/features/partes/components/clientes/clientes-table";
```

### Server Actions

- Always use `authenticatedAction` wrapper from `@/lib/safe-action`
- Naming: `actionCriar`, `actionAtualizar`, `actionListar`, `actionDeletar`
- Return: `{ success: boolean; data?: T; error?: string }`
- Place in `src/features/{module}/actions/{entity}-actions.ts`

### UI Components (mandatory patterns)

| Use Case | Component | Import |
|----------|-----------|--------|
| Page layout | `PageShell` | `@/components/shared/page-shell` |
| Data table | `DataShell` + `DataTable` | `@/components/shared/data-shell` |
| Form dialog | `DialogFormShell` | `@/components/shared/dialog-form-shell` |
| Detail panel | `DetailSheet` | `@/components/shared/detail-sheet` |

Gold standard: `src/features/partes/components/clientes/clientes-table-wrapper.tsx`

### Badge colors — never hardcode

```typescript
import { getSemanticBadgeVariant } from '@/lib/design-system';
<Badge variant={getSemanticBadgeVariant('status', 'ATIVO')}>Ativo</Badge>
```

### Naming conventions

Files=kebab-case, Components=PascalCase, Functions=camelCase, Types=PascalCase, Constants=UPPER_SNAKE_CASE, SQL=snake_case

### Database (Supabase)

- All tables require RLS policies
- Migrations: `supabase/migrations/YYYYMMDDHHmmss_description.sql`
- `database.types.ts` is auto-generated — do not edit
- Use `createClient()` from `@/lib/supabase/server`

### Testing

- Coverage: 80% global, 90% for domain/service, 95% for lib/utils
- Test by module: `npm run test:actions:processos`, `npm run test:actions:partes`

## Routing

- `/app/*` — Dashboard (Supabase auth required)
- `/portal/*` — Client portal (CPF session cookie)
- `/api/mcp` — MCP endpoint (SSE)

## Environment Variables

Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`, `SUPABASE_SECRET_KEY`, `SERVICE_API_KEY`, `CRON_SECRET`

Full list in `.env.example`.

## Additional Context

@src/components/shared/AI_INSTRUCTIONS.md
