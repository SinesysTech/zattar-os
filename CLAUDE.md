# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projeto

**ZattarOS** (Synthropic) — sistema corporativo de gestão jurídica. Schema de banco, identificadores e termos de UI estão em **português**. Stack: Next.js 16 (App Router + Turbopack), React 19, TypeScript 5 estrito, Supabase (Postgres + RLS + pgvector), Redis, Tailwind 4, shadcn/ui (new-york).

Documentação complementar:
- [`AGENTS.md`](./AGENTS.md) — visão concisa multi-plataforma.
- [`docs/architecture/ARCHITECTURE.md`](./docs/architecture/ARCHITECTURE.md) — diagrama de camadas, Plate AI, RAG.
- [`src/components/shared/AI_INSTRUCTIONS.md`](./src/components/shared/AI_INSTRUCTIONS.md) — padrões obrigatórios de UI (Glass / Neon Magistrate).

## Comandos Essenciais

```bash
# Dev
npm run dev                       # Turbopack, NODE_OPTIONS=--max-old-space-size=8192
npm run dev:webpack               # Fallback sem Turbopack

# Validação
npm run type-check                # tsc --noEmit
npm run lint                      # ESLint, --max-warnings=0
npm run check:architecture        # Bloqueia deep-imports e padrões legados (@/features, @/backend, @/core, @/app/_lib)
npm run validate:exports          # Valida barrel files (index.ts) dos módulos
npm run validate:design-system    # Audita uso de tokens em componentes

# Build
npm run build                     # check:architecture + webpack build (8GB heap)
npm run build:ci                  # Turbopack, 6GB heap, sem PWA — usado em Cloudron/CI

# Testes
npm test                          # Jest 30 (dois projects: node + jsdom)
npx jest <caminho/do/teste>       # Teste único (sempre por path, não há atalho global)
npm run test:actions              # Apenas Server Actions
npm run test:e2e                  # Playwright

# MCP / IA
npm run mcp:check                 # Verifica registry em src/lib/mcp/registry.ts
npm run mcp:dev                   # Servidor MCP standalone (debug)
npm run ai:reindex                # Reindexa embeddings no pgvector

# Tipos do banco
npm run db:types                  # Regenera src/types/database.types.ts
npm run db:types:check            # Valida que types estão sincronizados com Supabase
```

## Arquitetura: FSD Colocated

Feature-Sliced Design **colocalizado com as rotas**. Cada módulo é uma rota dentro de `src/app/(authenticated)/{módulo}/` e contém toda a lógica daquele domínio.

### Estrutura obrigatória de cada módulo

```
src/app/(authenticated)/{módulo}/
  domain.ts        # Zod schemas, tipos, enums, regras puras (sem I/O)
  service.ts       # Casos de uso (orquestração + regras de negócio)
  repository.ts    # Apenas Supabase queries (isolado)
  actions/         # Server Actions exportáveis (consumidas por UI E MCP)
  components/      # UI React específica do domínio
  page.tsx         # Rota Next
  index.ts         # Barrel — ÚNICA API pública
  RULES.md         # Regras de negócio do módulo (obrigatório para IA)
```

**A migração `src/features/` → `app/(authenticated)/` está completa.** Qualquer import de `@/features/`, `@/backend/`, `@/core/` ou `@/app/_lib/` é tratado como violação legada por `scripts/dev-tools/architecture/check-architecture-imports.js` e quebra o build.

### Fluxo de dados

```
UI / MCP → actions/ (authenticatedAction + Zod) → service.ts → repository.ts → Supabase
                                                        ↓
                                          after() → indexação RAG (pgvector)
```

Toda action retorna `ActionResult<T> = { success, data?, error?, errors?, message }` (`src/lib/safe-action.ts`).

### Regras invioláveis

1. **Sem deep-imports cross-módulo.** `import { x } from "@/app/(authenticated)/{módulo}"` só. Importar de `components/`, `actions/`, `service.ts`, etc. de outro módulo é violação. Auto-imports (módulo para si mesmo) são permitidos.
2. **Server Actions sempre via `authenticatedAction`** (de `@/lib/safe-action`). Nomenclatura: `actionCriar`, `actionListar`, `actionAtualizar`, `actionDeletar`. As actions são dual-use (UI via `FormData` e MCP via JSON) — não assuma um dos dois.
3. **UI envelopada nos shells de `@/components/shared/`**: `PageShell`, `DataShell` + `DataTable` + `DataTableToolbar` + `DataPagination`, `DialogFormShell`, `EmptyState`. Os componentes legados `TableToolbar`, `TableWithToolbar`, `ResponsiveTable` estão **deprecados**.
4. **Sem cores hardcoded em badges.** Use `getSemanticBadgeVariant()` de `@/lib/design-system`.
5. **Glass Briefing / Neon Magistrate é mandatório** em painéis principais: `<GlassPanel depth={1|2|3}>` em vez de `bg-card`, `<AnimatedNumber>` em estatísticas, `<Sparkline>` em métricas com tendência. Detalhes em `src/components/shared/AI_INSTRUCTIONS.md`.
6. **Sem componente `Sheet`.** Detail panels e formulários sempre usam `DialogFormShell` (centralizado).
7. **Naming**: arquivos/pastas `kebab-case`, componentes/tipos `PascalCase`, funções `camelCase`, constantes `UPPER_SNAKE_CASE`, banco `snake_case`.
8. **`src/types/database.types.ts` é gerado** (`npm run db:types`). Nunca editar manualmente.

### Path aliases (tsconfig.json)

`@/*` → `src/*`, e os específicos `@/app/*`, `@/components/*`, `@/lib/*`, `@/hooks/*`, `@/types/*`, `@/types/domain/*`, `@/types/contracts/*`.

## MCP (Model Context Protocol)

O MCP server expõe Server Actions como ferramentas para agentes:
- Endpoint: `GET/POST /api/mcp` (SSE).
- Registro: `src/lib/mcp/registry.ts` — adicionar nova ferramenta significa registrar a action ali.
- Rate limit/auth: reutilizado em `/api/plate/ai` (editor com Plate + AI SDK).
- `npm run mcp:check` valida o registry; **deve passar antes de comitar** se você tocou em actions.

## Camadas globais (`src/lib/`)

| Pasta | Papel |
|---|---|
| `safe-action.ts` | `authenticatedAction`, `publicAction`, `ActionResult`. Wrapper único para todas as Server Actions. |
| `auth/` | `authenticateRequest`, sessão, JWT, RLS context. |
| `supabase/` | Clientes server/browser (`@supabase/ssr`), tipados via `database.types.ts`. |
| `ai/` | `embedding`, `indexing`, `retrieval`, `obterContextoRAG`. |
| `mcp/` | `registry`, `server`, rate-limit. |
| `redis/` | Cache opcional (`ENABLE_REDIS_CACHE`). |
| `design-system/` | Tokens, `getSemanticBadgeVariant`, helpers de cor/spacing. |

## Testes

Jest 30 com **dois projects paralelos**:
- `node` — `__tests__/**/*.test.ts` em `app/(authenticated)/` e `lib/` (services, repositories, actions).
- `jsdom` — `*.test.tsx` em `components/`, `hooks/`, `providers/`, `lib/` (UI/hooks).

Coverage alvo (manter): ≥80% global, ≥90% para `domain/`+`service/`, ≥95% para `lib/utils/`.

Mocks centralizados em `src/__mocks__/` (Supabase, `next/headers`, `next/cache`, `server-only`, Radix UI, Copilotkit). E2E via Playwright (`playwright.config.ts`).

## Workflow

- **Solo-dev: sem PR.** Commits vão direto na branch (`master`). Não rodar `gh pr create`.
- **Higiene de staging antes de commit**: rodar `git status --short` antes de `git commit` — `git add <arquivo>` não limpa staging alheio.
- **Causa raiz, não paliativo.** Não há "quick fix"; toda correção deve atacar a causa arquitetural correta.
- **Mensagens de commit em português**, padrão Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`).

## Deploy (Cloudron)

- App principal (ZattarOS): `npm run deploy:cloudron` (build local + push) ou `:remote` (build em runner).
- Strapi CMS dos Insights vive em `~/Projetos/zattar-strapi` (repo separado).
- **Cloudron CLI lê o manifest do CWD** — sempre concatenar `cd projeto && cloudron <cmd>` no MESMO comando bash.
- Build em container Linux usa `experimental.cpus=2` no `next.config.ts` para evitar OOM em "Collecting page data" / "Generating static pages". Não baixar `--max-old-space-size` do `build:ci` sem medir o pico real.

## Variáveis de ambiente críticas

Sem elas, actions falham em runtime: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`, `SUPABASE_SECRET_KEY`, `SERVICE_API_KEY`, `CRON_SECRET`. IA precisa de `OPENAI_API_KEY` e/ou `AI_GATEWAY_API_KEY`. Lista completa em `.env.example`.

## Arquivos de referência (gold standard)

- Tabela + dialogs: `src/app/(authenticated)/partes/components/clientes/clientes-table-wrapper.tsx`
- Padrão de header com botão primário: `src/app/(authenticated)/audiencias/audiencias-client.tsx:231` (`Button size="sm" rounded-xl + Plus size-3.5`).
- Detail dialog (sem `Sheet`): `src/app/(authenticated)/expedientes/components/expediente-visualizar-dialog.tsx`.

Em qualquer dúvida sobre regras de negócio de um módulo, ler primeiro o `RULES.md` daquele módulo.
