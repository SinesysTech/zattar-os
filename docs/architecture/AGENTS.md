
# AGENTS.md
This file provides guidance to Verdent when working with code in this repository.

## Table of Contents
1. [Commonly Used Commands](#commands)
2. [High-Level Architecture & Structure](#architecture)
3. [Key Rules & Constraints](#key-rules--constraints)
4. [Development Hints](#development-hints)

## Commands

### Development
```powershell
# Start development server (Turbopack)
npm run dev

# Start with Webpack (for debugging)
npm run dev:webpack

# Type checking
npm run type-check
npm run type-check:skip-lib
```

### Build
```powershell
# Standard build (local)
npm run build

# CI/Docker build (recommended for deployment - uses higher heap)
npm run build:ci

# Build with bundle analyzer
$env:ANALYZE="true"; npm run build

# Architecture validation (runs before build)
npm run check:architecture
npm run validate:arch
npm run validate:arch:strict
```

### Testing
```powershell
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage (HTML report)
npm run test:coverage
npm run test:coverage:open

# CI tests (optimized)
npm run test:ci

# Test by type
npm run test:unit
npm run test:integration
npm run test:components
npm run test:e2e              # Playwright E2E

# Test by module
npm run test:actions
npm run test:actions:processos
npm run test:actions:partes
npm run test:actions:financeiro
npm run test:enderecos
npm run test:pericias
npm run test:portal-cliente
```

### Linting & Validation
```powershell
# ESLint
npm run lint

# Validate architecture imports
npm run check:architecture

# Validate exports
npm run validate:exports
npm run validate:exports:verbose
```

### AI & MCP
```powershell
# MCP server management
npm run mcp:check             # Verify registered tools
npm run mcp:dev               # Development MCP server
npm run mcp:generate          # Generate tool definitions
npm run mcp:test              # Test MCP tools
npm run mcp:test-all          # Test all tools
npm run mcp:docs              # Generate documentation

# AI indexing
npm run ai:reindex            # Reindex all documents for RAG
npm run ai:index-existing     # Index existing documents
npm run ai:index-dry-run      # Dry run indexing
```

### Database & Scripts
```powershell
# Populate tables
npm run populate:tabelas-audiencias

# User synchronization
npm run sincronizar-usuarios

# Design system validation
npm run validate:design-system
```

## Architecture

### High-Level Overview

Sinesys is a legal management system (gestão jurídica) using **Feature-Sliced Design (FSD)** with **Domain-Driven Design (DDD)** principles.

**Stack**: Next.js 16 (App Router), React 19, TypeScript 5, Supabase (PostgreSQL + RLS), Redis, Tailwind CSS 4, shadcn/ui

```
┌─────────────────────────────────────────────────────────────────┐
│                         CAMADA UI                               │
│  React 19 + Next.js 16 + Tailwind CSS + shadcn/ui               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CAMADA DE SERVER ACTIONS                     │
│  Safe Action Wrapper + Validação Zod + Autenticação             │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│      API MCP SSE        │     │    Service Layer        │
│  /api/mcp (ferramentas) │     │  Business Logic         │
└─────────────────────────┘     └─────────────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CAMADA DE REPOSITÓRIO                        │
│  Supabase Client + Queries Tipadas                              │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌───────────────────┐ ┌───────────────┐ ┌───────────────┐
│     Supabase      │ │    Redis      │ │   AI/RAG      │
│  PostgreSQL + RLS │ │    Cache      │ │  pgvector     │
└───────────────────┘ └───────────────┘ └───────────────┘
```

### Directory Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (dashboard)/          # Dashboard routes (authenticated)
│   │   └── layout.tsx        # Layout with AppSidebar (SidebarProvider)
│   ├── (auth)/               # Auth routes (login, register)
│   └── api/                  # API Routes
│       ├── mcp/              # MCP endpoint (SSE)
│       └── plate/ai/         # Plate AI editor endpoint
│
├── features/                 # 🔥 FEATURE-SLICED DESIGN (30 modules)
│   ├── processos/            # ✅ Fully migrated
│   ├── partes/               # ✅ Fully migrated
│   ├── contratos/            # ✅ Fully migrated
│   ├── audiencias/           # ⚠️  Partial (missing service.ts, repository.ts)
│   ├── financeiro/           # ⚠️  Special subdomain pattern
│   ├── documentos/           # ⚠️  Partial (missing service.ts, repository.ts)
│   ├── assinatura-digital/   # ⚠️  Partial
│   ├── acervo/               # ✅ Fully migrated
│   ├── usuarios/             # ✅ Fully migrated
│   ├── enderecos/            # ✅ Fully migrated
│   └── [25 more features]/   # See migration status below
│
├── components/               # Shared UI components
│   ├── ui/                   # shadcn/ui primitives
│   ├── layout/               # Layout components (sidebar, header)
│   └── shared/               # Zattar patterns (PageShell, DataTableShell, etc.)
│
├── lib/                      # Infrastructure layer
│   ├── ai/                   # AI/RAG (embeddings, indexing, retrieval)
│   ├── mcp/                  # MCP server & registry
│   ├── auth/                 # Authentication
│   ├── supabase/             # Supabase clients (server, client, admin)
│   ├── redis/                # Redis cache
│   └── safe-action.ts        # Action wrapper (auth + validation)
│
├── hooks/                    # Global hooks
└── types/                    # Shared types
```

### Feature Module Anatomy

Each feature follows the **Domain → Service → Repository → Actions** pattern:

```
src/features/{modulo}/
├── components/           # React components specific to this feature
│   ├── {entidade}/       # Grouped by entity
│   └── shared/           # Shared within feature
├── hooks/                # Custom hooks
├── actions/              # Server Actions (Next.js 16)
│   └── {entidade}-actions.ts
├── domain.ts             # 🔥 Entities, Value Objects, Zod schemas, pure rules
├── service.ts            # 🔥 Use cases, business logic
├── repository.ts         # 🔥 Data access (Supabase queries)
├── types.ts              # TypeScript types
├── utils.ts              # Formatters, validators
├── RULES.md              # 🤖 Business rules for AI context [inferred]
└── index.ts              # Barrel exports
```

**Key files**:
- `domain.ts`: Zod schemas, types, constants, pure business rules
- `service.ts`: Orchestrates business logic, calls repository, handles validation
- `repository.ts`: Supabase queries (CRUD, filters)
- `actions/*.ts`: Server Actions (use `authenticatedAction` wrapper)
- `RULES.md`: AI context for business rules (9/30 features have this) [inferred]

### Feature Migration Status

| Status | Count | Features |
|--------|-------|----------|
| ✅ **Fully Migrated** | 17/30 | acervo, advogados, ai, assistentes, captura, cargos, contratos, enderecos, expedientes, notificacoes, obrigacoes, pangea, pericias, processos, rh, tipos-expedientes, usuarios |
| ⚠️ **Partially Migrated** | 7/30 | assinatura-digital, audiencias, chat, documentos, partes, perfil, portal-cliente |
| ❌ **Not Migrated** | 6/30 | busca (actions-only), calendar (UI-only), financeiro (special pattern), profiles (config), repasses (stub), tasks (empty) |

**Architecture Completeness** [inferred]:
- domain.ts: 23/30 (77%)
- service.ts: 23/30 (77%)
- repository.ts: 19/30 (63%) ← **Lowest coverage**
- actions/: 25/30 (83%)
- components/: 28/30 (93%)
- RULES.md: 9/30 (30%) ← **Needs expansion**

### Major Subsystems

1. **Processos** (Legal Cases)
   - CRUD operations for legal processes
   - Integration with PJE/TRT tribunals via Playwright
   - Automated data capture (captura)
   - Timeline of events and documents

2. **Audiências** (Hearings)
   - Smart calendar with notifications
   - Responsibility assignment
   - Integration with process timeline

3. **Partes** (Parties)
   - Clients (clientes), opposing parties (partes contrárias), third parties (terceiros)
   - Representatives (representantes)
   - CPF/CNPJ validation

4. **Contratos** (Contracts)
   - Contract management
   - Digital signature integration (assinatura digital)
   - Legal compliance (MP 2.200-2/2001)

5. **Financeiro** (Financial)
   - Dashboard, accounts payable/receivable
   - Bank reconciliation (conciliação bancária - OFX/CSV import)
   - **Special subdomain pattern**: Uses `@/features/financeiro/{subdomain}/` structure [inferred]

6. **Documentos** (Documents)
   - Collaborative real-time editor (Plate + Yjs)
   - AI-powered editing via `/api/plate/ai` (Vercel AI SDK)
   - Versioning and attachments

7. **Captura** (Automated Data Capture)
   - PJE/TRT integration via Playwright
   - Multi-driver system (PJE, TRT, Comunica CNJ) [inferred]
   - Automated extraction of process data, hearings, parties

8. **Assinatura Digital** (Digital Signature)
   - Legal compliance: MP 2.200-2/2001
   - Template management
   - Form builder (formulários) with dynamic fields

9. **AI/RAG** (Semantic Search)
   - Embeddings generation (OpenAI/Cohere)
   - pgvector storage in Supabase
   - Semantic search over processes, documents

10. **MCP** (Model Context Protocol)
    - Exposes Server Actions as AI tools
    - SSE endpoint at `/api/mcp`
    - Registry-based tool discovery

11. **Security Headers**
    - HTTP security headers via middleware
    - CSP with nonce support for inline scripts/styles
    - Protection against XSS, clickjacking, MIME sniffing
    - Report-only mode by default (safe rollout)

### Data Flows

**Creating a Process (Processo)**:
```
UI (React) → actionCriarProcesso (Server Action)
  → service.criarProcesso (validation, business rules)
    → repository.create (Supabase INSERT)
      → after(() => indexarDocumento) (AI indexing, async)
  → revalidatePath('/processos')
  → return { success, data }
```

**MCP Tool Invocation**:
```
AI Agent → POST /api/mcp { tool: "criar_processo", args: {...} }
  → mcpRegistry.execute("criar_processo")
    → actionCriarProcesso (same as UI flow)
  → return { content: [...] }
```

**AI Editor Streaming**:
```
UI (Plate) → POST /api/plate/ai { prompt: "..." }
  → authenticateRequest (JWT or API key)
  → rateLimitCheck (Redis; fail-open if unavailable) [inferred]
  → openai.chat.completions.create({ stream: true })
  → StreamingTextResponse
```

### External Dependencies

- **Supabase**: PostgreSQL database with Row-Level Security (RLS)
- **Redis**: Cache layer (optional; graceful degradation if unavailable)
- **OpenAI/Cohere**: Embeddings for RAG
- **Backblaze B2**: Object storage (via Supabase Storage)
- **Playwright**: Headless browser automation (PJE/TRT scraping)
- **Docker Swarm + Traefik**: Production orchestration & reverse proxy [inferred from README]

### Development Entry Points

| Task | Entry Point |
|------|-------------|
| Add new feature | Create `src/features/{modulo}/` with domain → service → repository → actions |
| Add new page | `src/app/(dashboard)/{route}/page.tsx` (import from `@/features/{modulo}`) |
| Add new API endpoint | `src/app/api/{route}/route.ts` |
| Add UI component | `src/components/shared/{component}.tsx` (or `ui/` for primitives) |
| Add Server Action | `src/features/{modulo}/actions/{entity}-actions.ts` (use `authenticatedAction`) |
| Modify sidebar | `src/components/layout/sidebar/app-sidebar.tsx` |
| Add database migration | `supabase/migrations/{timestamp}_{name}.sql` |
| Add AI tool | `src/lib/mcp/registry.ts` (register via `registerMcpTool`) |

## Key Rules & Constraints

### From CLAUDE.md & README.md

1. **Feature-Sliced Design (FSD) is mandatory**
   - All new code must go into `src/features/{modulo}/`
   - Backend legacy folder removed; use features or lib only
   - Imports: `@/features/{modulo}`, `@/lib/{service}`, `@/components/{type}`

2. **No direct imports from feature internals**
   ```typescript
   // ✅ Correct - use barrel exports
   import { ClientesTable, actionListarClientes } from "@/features/partes";

   // ❌ Wrong - no deep imports
   import { ClientesTable } from "@/features/partes/components/clientes/clientes-table";
   ```

3. **Server Actions pattern**
   - Always use `authenticatedAction` wrapper from `@/lib/safe-action`
   - Return `{ success: boolean; data?: T; error?: string }`
   - Prefix with `action`: `actionCriar`, `actionAtualizar`, `actionListar`
   - Place in `src/features/{modulo}/actions/{entity}-actions.ts`

4. **Validation with Zod**
   - Define schemas in `domain.ts`
   - Use `.safeParse()` for validation
   - Never use `any` type; prefer `unknown` and validate

5. **Typing requirements**
   - TypeScript strict mode enabled
   - All exports must have explicit types
   - `ignoreBuildErrors: true` em next.config.ts (temporário - manter até corrigir erros críticos)
   - Executar `npm run type-check` antes de commits para validar tipos

6. **UI Component patterns**
   - Use shadcn/ui primitives (`@/components/ui`)
   - Use Zattar patterns:
     - `PageShell` for page layout
     - `DataTableShell` for tables (includes toolbar & pagination)
     - `DialogFormShell` for forms (multi-step support)
   - Responsive by default: use `useViewport()` hook and `ResponsiveTable`

7. **DialogFormShell requirements** [inferred from AGENTS.md]
   - White background: `bg-white dark:bg-gray-950`
   - Cancel button in footer (no X in header)
   - Multi-step progress bar integrated
   - Grid: `grid-cols-1 md:grid-cols-2`
   - Inputs: `w-full`

8. **Data Table action button pattern** [inferred]
   ```typescript
   // ✅ Correct
   <DataShell
     header={
       <DataTableToolbar
         actionButton={{
           label: 'Novo Item',
           onClick: () => setOpen(true),
         }}
       />
     }
   >

   // ❌ Wrong - actionButton not on DataShell directly
   <DataShell actionButton={{ ... }}>
   ```

9. **Test coverage thresholds** (jest.config.js)
   - Global: 80% (lines, branches, functions, statements)
   - domain.ts / service.ts: 90% statements
   - lib/formatters.ts, lib/utils.ts: 95% statements, 90% branches
   - lib/safe-action.ts: 90% statements, 85% branches
   - lib/auth/, lib/redis/: 85% statements, 80% branches

10. **Property-based testing** (fast-check)
    - Required for formatters and utils in `src/lib/`
    - Place in `src/lib/__tests__/unit/` [inferred from README]

11. **Supabase RLS (Row-Level Security)**
    - All tables must have RLS policies
    - Use service role key only for admin operations
    - Prefer user-scoped queries (RLS enforces access)

12. **PWA (Progressive Web App)**
    - Build with Webpack: `npm run build:prod`
    - Service worker generated in `public/` (ignored by git)
    - Offline fallback: `/offline` page

13. **AI Editor** (Plate)
    - Requires `AI_GATEWAY_API_KEY` environment variable
    - Rate limiting via Redis (fail-open if unavailable)
    - Supports JWT, API key, or session auth [inferred from ARCHITECTURE.md]

14. **MCP (Model Context Protocol)**
    - Server Actions auto-exposed as tools (via registry)
    - Endpoint: `/api/mcp` (GET for SSE connection, POST for execution)
    - Configuration: `.mcp.json` in project root

15. **Redis cache**
    - Optional; graceful degradation if unavailable
    - Use `@/lib/redis` for caching
    - Enable via `ENABLE_REDIS_CACHE=true`

16. **Architecture validation**
    - Runs before build: `npm run check:architecture`
    - Validates imports follow FSD rules
    - Strict mode: `npm run validate:arch:strict`

17. **Naming conventions**
    - Files: `kebab-case.ts` (`cliente-form.tsx`)
    - Components: `PascalCase` (`ClienteForm`)
    - Functions: `camelCase` (`criarCliente`)
    - Types: `PascalCase` (`Cliente`, `CriarClienteParams`)
    - Constants: `UPPER_SNAKE_CASE` (`STATUS_LABELS`)
    - SQL: `snake_case` (table and column names)

18. **Node.js version**: `>=24.9.0` [inferred from package.json]

### From .cursor/rules/ (Supabase & Design)

Files in `.cursor/rules/`:
- `create-db-functions.mdc`
- `create-migration.mdc`
- `create-rls-policies.mdc`
- `design-system-protocols.mdc`
- `postgres-sql-style-guide.mdc`
- `use-realtime.mdc`
- `writing-supabase-edge-functions.mdc`

Key principles [inferred from file names]:
- Follow PostgreSQL style guide for SQL
- RLS policies required for all tables
- Design system protocols for UI consistency
- Realtime subscriptions via Supabase
- Edge functions for serverless compute

## Development Hints

### Adding a New API Endpoint

1. **Server Action (recommended)**:
   ```typescript
   // src/features/{modulo}/actions/{entity}-actions.ts
   "use server";
   import { authenticatedAction } from "@/lib/safe-action";
   import { revalidatePath } from "next/cache";
   import * as service from "../service";

   export const actionCriar = authenticatedAction(
     createSchema,
     async (data, { user }) => {
       const result = await service.criar(data);
       revalidatePath("/{modulo}");
       return result;
     }
   );
   ```

2. **API Route (for external integrations)**:
   ```typescript
   // src/app/api/{route}/route.ts
   import { NextRequest, NextResponse } from "next/server";
   import { createClient } from "@/lib/supabase/server";

   export async function GET(req: NextRequest) {
     const supabase = await createClient();
     // ... logic
     return NextResponse.json({ success: true, data });
   }
   ```

3. **MCP Tool (for AI agents)**:
   ```typescript
   // src/lib/mcp/registry.ts
   import { registerMcpTool } from "./registry";
   import { actionCriar } from "@/features/{modulo}/actions/{entity}-actions";

   registerMcpTool({
     name: "criar_{entity}",
     description: "Creates a new {entity}",
     schema: createSchema,
     handler: async (args) => {
       const result = await actionCriar(args);
       return actionResultToMcp(result);
     },
   });
   ```

### Configurando CORS

**Localizacao**: `src/lib/cors/config.ts`

**Adicionar nova origem permitida**:
1. Editar `.env.local` (desenvolvimento) ou variaveis de ambiente (producao)
2. Adicionar origem a variavel `ALLOWED_ORIGINS` (comma-separated)
3. Exemplo: `ALLOWED_ORIGINS=https://app.example.com,https://api.example.com`

**Endpoints com CORS configurado**:
- `/api/mcp` (MCP Server)
- `/api/mcp/stream` (MCP Stream)
- `/api/csp-report` (CSP Violations)
- Supabase Edge Functions (indexar-documentos, alertas-disk-io)

**Troubleshooting**:
- Erro "CORS policy: No 'Access-Control-Allow-Origin' header"
  -> Adicionar origem a whitelist via `ALLOWED_ORIGINS`
- Erro "CORS policy: The 'Access-Control-Allow-Origin' header contains multiple values"
  -> Verificar se middleware nao esta duplicando headers

**Documentacao completa**: `docs/security/cors-configuration.md`

### Modifying CI/CD Pipeline

**GitHub Actions**: `.github/workflows/tests.yml` [inferred from README]
- Runs tests, coverage, E2E (Playwright)
- Uploads to Codecov
- Comments on PRs with coverage analysis

**Docker Build**:
- Use `npm run build:ci` (higher heap allocation)
- Output: `standalone` (optimized for Docker)
- Multi-stage build reduces image size

**Caprover Deploy** [inferred from README, captain-definition file]:
- Build command: `npm run build:caprover`
- Uses `captain-definition` file in root

### Extending Subsystems

#### Adding a New Feature Module

1. **Create structure**:
   ```powershell
   mkdir src/features/nova-feature
   mkdir src/features/nova-feature/components
   mkdir src/features/nova-feature/hooks
   mkdir src/features/nova-feature/actions
   New-Item src/features/nova-feature/domain.ts
   New-Item src/features/nova-feature/service.ts
   New-Item src/features/nova-feature/repository.ts
   New-Item src/features/nova-feature/types.ts
   New-Item src/features/nova-feature/utils.ts
   New-Item src/features/nova-feature/index.ts
   New-Item src/features/nova-feature/RULES.md
   ```

2. **Define domain** (domain.ts):
   ```typescript
   import { z } from "zod";

   export const novaFeatureSchema = z.object({
     nome: z.string().min(3),
     descricao: z.string().optional(),
   });

   export type NovaFeature = z.infer<typeof novaFeatureSchema> & {
     id: number;
     created_at: string;
     updated_at: string;
   };

   export const STATUS_LABELS = {
     ativo: "Ativo",
     inativo: "Inativo",
   } as const;
   ```

3. **Implement repository** (repository.ts):
   ```typescript
   import { createClient } from "@/lib/supabase/server";
   import type { NovaFeature } from "./domain";

   export async function findAll(): Promise<NovaFeature[]> {
     const supabase = await createClient();
     const { data, error } = await supabase
       .from("nova_feature")
       .select("*")
       .order("nome");

     if (error) throw new Error(error.message);
     return data || [];
   }

   export async function create(params: unknown): Promise<NovaFeature> {
     const supabase = await createClient();
     const { data, error } = await supabase
       .from("nova_feature")
       .insert(params)
       .select()
       .single();

     if (error) throw new Error(error.message);
     return data;
   }
   ```

4. **Implement service** (service.ts):
   ```typescript
   import { novaFeatureSchema } from "./domain";
   import * as repo from "./repository";

   export async function listar() {
     return await repo.findAll();
   }

   export async function criar(params: unknown) {
     const validacao = novaFeatureSchema.safeParse(params);
     if (!validacao.success) {
       throw new Error(validacao.error.errors[0].message);
     }
     return await repo.create(validacao.data);
   }
   ```

5. **Create Server Actions** (actions/nova-feature-actions.ts):
   ```typescript
   "use server";
   import { authenticatedAction } from "@/lib/safe-action";
   import { revalidatePath } from "next/cache";
   import { novaFeatureSchema } from "../domain";
   import * as service from "../service";

   export const actionListar = authenticatedAction(
     null, // no input schema
     async (_, { user }) => {
       const data = await service.listar();
       return { success: true, data };
     }
   );

   export const actionCriar = authenticatedAction(
     novaFeatureSchema,
     async (data, { user }) => {
       const result = await service.criar(data);
       revalidatePath("/nova-feature");
       return { success: true, data: result };
     }
   );
   ```

6. **Export via barrel** (index.ts):
   ```typescript
   export type { NovaFeature } from "./domain";
   export { novaFeatureSchema, STATUS_LABELS } from "./domain";
   export { listar, criar } from "./service";
   export { actionListar, actionCriar } from "./actions/nova-feature-actions";
   ```

7. **Create page** (src/app/(dashboard)/nova-feature/page.tsx):
   ```typescript
   import { PageShell } from "@/components/shared/page-shell";
   import { NovaFeatureTable } from "@/features/nova-feature/components/nova-feature-table";
   import { actionListar } from "@/features/nova-feature";

   export default async function NovaFeaturePage() {
     const result = await actionListar();

     return (
       <PageShell
         title="Nova Feature"
         description="Gerenciamento de nova feature"
       >
         {result.success ? (
           <NovaFeatureTable data={result.data} />
         ) : (
           <div>Erro: {result.error}</div>
         )}
       </PageShell>
     );
   }
   ```

8. **Add to sidebar** (src/components/layout/sidebar/app-sidebar.tsx):
   - Add route entry to navigation items

9. **Create RULES.md** (for AI context):
   ```markdown
   # Regras de Negócio - Nova Feature

   ## Validação
   - Nome: mínimo 3 caracteres

   ## Regras
   - Não permitir duplicatas por nome
   - Status padrão: ativo
   ```

10. **Write tests**:
    - Unit tests: `src/features/nova-feature/__tests__/unit/`
    - Integration tests: `src/features/nova-feature/__tests__/integration/`
    - Actions tests: `src/features/nova-feature/__tests__/actions/`

#### Adding a Component to the Design System

1. Check if component exists in shadcn/ui catalog
2. If yes: `npx shadcn@latest add {component}`
3. If no: Create in `src/components/shared/{component}.tsx`
4. Follow shadcn/ui patterns (use `cn()`, variants via `class-variance-authority`)
5. Document usage in component JSDoc

#### Migrating an Existing Module

**Priority order** (based on completeness metrics):
1. Add `repository.ts` (lowest coverage: 63%)
2. Add `RULES.md` (lowest coverage: 30%)
3. Consolidate `service.ts` and `domain.ts` (77% coverage)

**Steps**:
1. Identify all files belonging to module (components, hooks, utils)
2. Create feature structure: `src/features/{modulo}/`
3. Move domain logic to `domain.ts` (schemas, types, constants)
4. Extract data access to `repository.ts` (Supabase queries)
5. Extract business logic to `service.ts` (use cases)
6. Consolidate Server Actions in `actions/` (use `authenticatedAction`)
7. Move components to `components/`
8. Create barrel export in `index.ts`
9. Update imports in pages and other features
10. Run tests: `npm run test:{modulo}`
11. Validate architecture: `npm run check:architecture`
12. Create `RULES.md` for AI context

#### Working with Playwright Automation (Captura)

- Entry point: `src/features/captura/`
- Drivers: PJE, TRT, Comunica CNJ [inferred]
- Scripts: `scripts/captura/`
- Test: `npm run test:api-acervo-geral`, `npm run test:api-audiencias`, etc.

**Adding a new tribunal**:
1. Create driver in `src/features/captura/drivers/{tribunal}/`
2. Implement interface from `src/features/captura/domain.ts`
3. Register in `src/features/captura/service.ts`
4. Add scraping logic (Playwright selectors)
5. Test with script: `tsx scripts/captura/test-captura-{tribunal}.ts`

#### Working with AI/RAG

**Indexing a new document type**:
```typescript
import { indexarDocumento } from "@/lib/ai/indexing";

// After creating entity
after(async () => {
  await indexarDocumento({
    texto: `${entity.titulo} ${entity.descricao}`,
    metadata: {
      tipo: "nova-feature",
      id: entity.id,
      created_at: entity.created_at,
    },
  });
});
```

**Querying semantic search**:
```typescript
import { buscaSemantica } from "@/lib/ai/retrieval";

const resultados = await buscaSemantica("query string", {
  limite: 10,
  threshold: 0.7,
  filtros: { tipo: "nova-feature" },
});
```

**Reindexing**:
```powershell
npm run ai:reindex
```

#### Working with Security Headers

**Location**: `src/middleware/security-headers.ts`

**Headers applied**:
- Content-Security-Policy (report-only mode by default)
- Strict-Transport-Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy

**Using nonces in components**:
```typescript
import { useCSPNonce } from '@/hooks/use-csp-nonce';

function MyComponent() {
  const nonce = useCSPNonce();
  return <style jsx nonce={nonce}>{`...`}</style>;
}
```

**Adding a trusted domain**:
1. Edit `src/middleware/security-headers.ts`
2. Add domain to `TRUSTED_DOMAINS` in the appropriate category
3. Update `buildCSPDirectives()` to include it in the right directive
4. Test in report-only mode first
5. Check `/api/csp-report` for violations

**Environment variables**:
- `CSP_REPORT_ONLY=true` - Enable/disable enforcement (default: true)
- `CSP_REPORT_URI=/api/csp-report` - Endpoint for violation reports

**Documentation**: See `docs/security/security-headers.md` for complete guide.

#### Environment Variables

**Required**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Optional**:
- `ENABLE_REDIS_CACHE=true`
- `REDIS_URL`
- `REDIS_PASSWORD`
- `AI_GATEWAY_API_KEY` (required for Plate AI editor)
- `AI_DEFAULT_MODEL`
- `AI_EMBEDDING_PROVIDER=openai` (or `cohere`)
- `AI_EMBEDDING_CACHE_ENABLED=true`
- `SINESYS_API_TOKEN` (for MCP)
- `OPENAI_API_KEY`

#### Troubleshooting

**Build fails with OOM (Out of Memory)**:
- Use `npm run build:ci` (allocates more heap)
- Or set `NODE_OPTIONS=--max-old-space-size=8192`

**TypeScript errors on build**:
- `ignoreBuildErrors: true` mantido em next.config.ts (remoção gradual planejada)
- Executar `npm run type-check` localmente antes de commits
- Para builds de emergência, use `npm run type-check:skip-lib` se disponível
- Erros atuais concentrados em features novas (config-atribuicao) - código estável está limpo

**Tests fail with coverage threshold**:
- Check jest.config.js for thresholds
- Run `npm run test:coverage:open` to see uncovered lines

**PWA not working**:
- Ensure build with Webpack: `npm run build:prod` (not Turbopack)
- Check `public/` for generated service worker
- See README.md section "Progressive Web App (PWA)"

**MCP tools not registered**:
- Run `npm run mcp:check` to verify
- Check `.mcp.json` configuration
- Restart MCP server: `npm run mcp:dev`

**Redis connection fails**:
- System degrades gracefully (no crash)
- Check `REDIS_URL` and `REDIS_PASSWORD`
- Verify `ENABLE_REDIS_CACHE=true`

**Architecture validation fails**:
- Run `npm run check:architecture`
- Fix imports to follow FSD rules
- Use barrel exports (`@/features/{modulo}`)

---

**Last updated**: 2026-01-05
**Maintained by**: Sinesys Team
**For AI agents**: This file is the authoritative guide for code changes. Always consult before major refactoring.
