# Zattar OS - Sistema de Gestão Jurídica by Sinesys

Sistema de gestão jurídica com foco em automação e IA.

**Stack**: Next.js 16 (App Router), React 19, TypeScript 5, Supabase (PostgreSQL + RLS), Redis (opcional), Tailwind CSS 4, shadcn/ui.

## Status de Desenvolvimento (2026-02-25)

`src/features` possui **37 módulos** atualmente.

Classificação estrutural (critério: `domain.ts`, `service.ts`, `repository.ts`, `index.ts`, `actions/`, `components/`):

- ✅ **Completos (17)**: `acervo`, `advogados`, `ai`, `captura`, `config-atribuicao`, `contratos`, `dify`, `enderecos`, `integracoes`, `notificacoes`, `obrigacoes`, `pecas-juridicas`, `pericias`, `processos`, `rh`, `tipos-expedientes`, `usuarios`
- ⚠️ **Parciais (14)**: `assistentes-tipos`, `audiencias`, `calendar`, `cargos`, `chat`, `chatwoot`, `documentos`, `expedientes`, `financeiro`, `partes`, `perfil`, `profiles`, `system-prompts`, `tags`
- 🧩 **Iniciais (6)**: `admin`, `audit`, `busca`, `repasses`, `tasks`, `twofauth`

Consulte [STATUS de arquitetura](./docs/architecture/STATUS.md) e [AGENTS](./docs/architecture/AGENTS.md) para detalhes completos.

## Requisitos

- Node.js `>= 22.0.0`
- npm `>= 10`
- (Opcional) Docker

> Windows: alguns scripts auxiliares usam shell POSIX. Se necessário, use WSL ou Git Bash.

## Início rápido

1. Instalar dependências

```bash
npm install
```

2. Variáveis de ambiente

```bash
cp .env.example .env.local
```

3. Rodar em desenvolvimento (Turbopack)

```bash
npm run dev
```

Acesse:

- App: http://localhost:3000
- Health: http://localhost:3000/api/health

## Variáveis de ambiente

A lista completa está em `.env.example`. Principais:

Obrigatórias (para o app funcionar):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`
- `SUPABASE_SECRET_KEY`
- `SERVICE_API_KEY`
- `CRON_SECRET`

Busca semântica / RAG:

- `OPENAI_API_KEY`
- `OPENAI_EMBEDDING_MODEL` (padrão: `text-embedding-3-small`)
- `ENABLE_AI_INDEXING` (padrão: `true`)

Opcionais (dependem dos módulos):

- Redis/cache: `ENABLE_REDIS_CACHE`, `REDIS_URL`, `REDIS_PASSWORD`, `REDIS_CACHE_TTL`
- Plate AI editor: `AI_GATEWAY_API_KEY`
- Dyte (chamadas): configurado via UI em Configurações > Integrações
- Storage Backblaze B2: `STORAGE_PROVIDER`, `B2_*`
- Browser service (scraping): `BROWSER_WS_ENDPOINT`, `BROWSER_SERVICE_URL`, `BROWSER_SERVICE_TOKEN`
- MCP (integrações): `MCP_SINESYS_API_URL`, `MCP_SINESYS_API_KEY`
- Segurança: `CSP_REPORT_ONLY`, `ALLOWED_ORIGINS`, `RATE_LIMIT_FAIL_MODE`

## Comandos úteis

Dev:

```bash
npm run dev
npm run dev:webpack
npm run type-check
```

Build:

```bash
npm run build
npm run build:ci
npm run build:prod
```

Testes:

```bash
npm test
npm run test:ci
npm run test:unit
npm run test:integration
npm run test:components
npm run test:e2e
```

Arquitetura/exports:

```bash
npm run check:architecture
npm run validate:arch
npm run validate:exports
```

MCP / IA:

```bash
npm run mcp:check
npm run mcp:dev
npm run mcp:docs

npm run ai:reindex
npm run ai:index-existing
```

Segurança:

```bash
npm run security:scan
npm run security:gitleaks
```

## Arquitetura (resumo)

- UI: Next.js + React
- Server Actions: wrapper de ação segura + validação Zod + autenticação
- Service layer: regras e casos de uso
- Repository layer: acesso a dados via Supabase
- Infra: Redis (cache), AI/RAG (embeddings/pgvector), MCP (SSE)

Detalhes: `ARCHITECTURE.md`.

## Estrutura do projeto

Padrão principal (Feature-Sliced Design):

```
src/
  app/                 # Rotas (Next.js App Router)
  features/            # Módulos (domain/service/repository/actions)
  components/          # UI compartilhada (shadcn/ui + padrões)
  lib/                 # Infra (auth, supabase, redis, mcp, ai, etc.)
  hooks/               # Hooks globais
```

Regra importante: não usar imports profundos em features — prefira barrel exports:

```ts
import { actionListarClientes } from "@/features/partes";
```

## MCP (Model Context Protocol)

Endpoint:

- `GET /api/mcp` — conexão SSE
- `POST /api/mcp` — execução de ferramenta

## Docker

Build e execução local:

```bash
docker build -t sinesys:local .
docker run -p 3000:3000   -e NEXT_PUBLIC_SUPABASE_URL=...   -e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=...   -e SUPABASE_SECRET_KEY=...   sinesys:local
```

Também existe `docker-compose.yml` para subir o app via env vars.

## Docs

- [Documentação geral](./docs/README.md)
- [Índice da documentação](./docs/INDEX.md)
- [Status da arquitetura](./docs/architecture/STATUS.md)
- [Guia para agentes](./docs/architecture/AGENTS.md)
- [Módulos](./docs/modules/README.md)
