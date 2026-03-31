# AGENTS.md

This file provides guidance to AI coding agents working with code in this repository.

## Project

Sinesys (Zattar OS) — legal management system (gestao juridica) for a Brazilian law firm.
Codebase is primarily in Portuguese (variable names, business terms, UI labels).

**Stack**: Next.js 16 (App Router, Turbopack), React 19, TypeScript 5 (strict), Supabase (PostgreSQL + RLS + pgvector), Tailwind CSS 4, shadcn/ui (new-york style)

**Node**: >= 22.0.0, npm >= 10

## Commands

```bash
# Development
npm run dev                    # Turbopack dev server
npm run dev:webpack            # Webpack dev server (debugging)
npm run type-check             # TypeScript validation

# Build
npm run build                  # Standard build
npm run build:ci               # CI/Docker build (higher heap)

# Testing
npm test                       # All tests (Jest 30)
npm run test:unit              # Unit tests
npm run test:integration       # Integration tests
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

1. **Import constraints** (ESLint-enforced): cross-feature imports must use barrel exports (`@/features/{module}`). No deep imports into feature internals.

2. **Server Actions**: use `authenticatedAction` from `@/lib/safe-action`. Naming: `actionCriar`, `actionAtualizar`, `actionListar`, `actionDeletar`.

3. **UI components**: use `PageShell`, `DataShell`+`DataTable`, `DialogFormShell`, `DetailSheet` from `@/components/shared/`. Full docs in `src/components/shared/AI_INSTRUCTIONS.md`.

4. **Badge colors**: never hardcode. Use `getSemanticBadgeVariant()` from `@/lib/design-system`.

5. **Naming**: files=kebab-case, components=PascalCase, functions=camelCase, types=PascalCase, constants=UPPER_SNAKE_CASE, SQL=snake_case.

6. **Database**: all tables require RLS. Migrations in `supabase/migrations/`. `database.types.ts` is auto-generated.

7. **Testing**: 80% coverage global, 90% for domain/service, 95% for lib/utils. Test by module: `npm run test:actions:{module}`.

## Routing

- `/app/*` — Dashboard (Supabase auth required)
- `/portal/*` — Client portal (CPF session cookie)
- `/api/mcp` — MCP endpoint (SSE)

## Environment

Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`, `SUPABASE_SECRET_KEY`, `SERVICE_API_KEY`, `CRON_SECRET`

Full list in `.env.example`.

## Extended Documentation

- `CLAUDE.md` — Claude Code specific guidance
- `GEMINI.md` — Gemini CLI specific guidance
- `.github/copilot-instructions.md` — GitHub Copilot instructions
- `docs/architecture/AGENTS.md` — Extended agent reference with data flows, troubleshooting, development hints
- `src/components/shared/AI_INSTRUCTIONS.md` — Complete UI component patterns
- `src/features/*/RULES.md` — Business rules per feature module
