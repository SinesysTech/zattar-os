# CLAUDE.md

Este documento provê diretivas diretas e definitivas para ferramentas baseadas em CLI como o Claude Code ou Gemini.

## Visão Geral do Projeto

**ZattarOS** (desenvolvido pela Synthropic) — Sistema corporativo para firmas legais. A base inteira usa linguagem de negócios em PT-BR.
**Stack**: Next.js 16 (App Router + Turbopack), React 19, TypeScript 5, Supabase (RLS + pgvector), Redis, Tailwind CSS 4, shadcn/ui.

## Comandos Chave

```bash
npm run dev                          # Servidor local via Turbopack
npm run type-check                   # Verificação de tipagem rígida
npm run build:ci                     # Build CI com limite de RAM alto
npm test                             # Todos os testes de unidade
npm run test:e2e                     # Scrappers e fluxos end-to-end
npm run check:architecture           # Valida violações arquiteturais do FSD
npm run validate:exports             # Valida barreiras
npm run audit:design-system          # Auditoria completa do DS (KPIs, cobertura, ofensores)
npm run audit:design-system:save     # Salva snapshot em design-system/reports/
npm run audit:design-system:ci       # CI mode — exit 1 se KPI bloqueador falhar
```

## Arquitetura de Módulos (FSD + Colocation)

Todos os domínios funcionais do ZattarOS residem sob a hierarquia de rotas em `src/app/(authenticated)`.

```text
src/
├── app/
│   ├── (authenticated)/         # FSD Area (admin)
│   │   ├── processos/           # Módulo `processos`
│   │   │   ├── domain.ts        # Tipos/Schemas (Zod)
│   │   │   ├── service.ts       # Lógica e regras
│   │   │   ├── repository.ts    # Fetch de Dados
│   │   │   ├── actions/         # Actions que invocam services (+ safe-action)
│   │   │   ├── components/      # UI (React)
│   │   │   ├── hooks/           # Interação UI/Logic
│   │   │   ├── RULES.md         # Documento de Contexto
│   │   │   ├── index.ts         # Exportação autorizada
│   │   │   └── page.tsx         # Página e Rota Front-End
│   └── (assinatura-digital)/    # Rota pública (wizard + assinatura por token)
│       ├── _wizard/             # Steps do wizard de formulário público
│       ├── formulario/          # Rota dinâmica pública
│       └── assinatura/[token]/  # Rota de assinatura por token
├── shared/                      # Domínios compartilhados entre rotas públicas e admin
│   └── assinatura-digital/      # Store, types, services, actions, inputs, pdf, signature
├── components/                  # UI Shared, Shadcn, Shells, Layouts
├── lib/                         # Core infra (Supabase, MCP, redis, AI)
```

**Convenção `shared/`**: quando um domínio é consumido por mais de uma rota (ex: público em `(assinatura-digital)/` + admin em `(authenticated)/...`) e/ou por API routes (`src/app/api/...`), o código compartilhado (store, types, services, actions, utils, validations, inputs genéricos) vive em `src/shared/<dominio>/`. Componentes exclusivos de uma rota ficam colocados naquela rota (`_wizard/`, `components/`, etc.). **Evita cross-group imports público↔authenticated**.

**Backlog arquitetural** — migrar as rotas admin de `src/app/(authenticated)/assinatura-digital/` (e outros módulos espelhados) para um sistema de permissões por perfil no painel. Objetivo: uma única rota por domínio, com visibilidade de ações (criar/editar/apagar template, etc.) condicionada a `user.role === 'admin'` em vez de segregação por path. Não iniciar antes de terminar o redesign do fluxo público + testes.

**Regras Absolutas**:
1. **Nada de Cross-Deep Imports**: Componentes de `processos` não podem importar de `financeiro/components/...`. Exija `import { x } from "@/app/(authenticated)/financeiro"`.
2. **Uso de Action-Wrapper**: Se for criar Server Actions, embrulhe o método sob `authenticatedAction` (`@/lib/safe-action`).
3. **Padrões de Shell UI**: Use componentes casca obrigatórios: `PageShell`, `DataShell`, `DialogFormShell` exportados em `@/components/shared`.

**Módulos Intencionalmente Minimais**:
Alguns módulos sob `(authenticated)/` são propositalmente embrionários (proxies, sistemas auto-descritivos, cálculos puros, FSD aninhado em `feature/`). **Não tente "consertá-los" criando arquivos vazios** — eles têm `README.md` próprio explicando o estado intencional. Consulte [docs/architecture/MINIMAL_MODULES.md](docs/architecture/MINIMAL_MODULES.md) para a lista completa e os critérios de promoção.

## Design System — "Glass Briefing"

O ZattarOS usa o DS **Glass Briefing** — glassmorphism sutil sobre fundação sólida, OKLCH ancorado em hue 281° (Zattar Purple), tipografia Montserrat+Inter. **Toda UI admin DEVE aderir.**

### Fontes (única verdade)

| Fonte | Papel |
|---|---|
| [src/app/globals.css](src/app/globals.css) | Tokens canônicos (226 CSS variables + classes `.glass-*`) |
| [src/lib/design-system/](src/lib/design-system/) | Mirror TS: `tokens.ts`, `token-registry.ts`, `semantic-tones.ts`, `variants.ts` |
| [design-system/README.md](design-system/README.md) | Contrato narrativo (manifesto, voice, visual foundations, iconography) |
| [design-system/VISUAL-REVIEW.md](design-system/VISUAL-REVIEW.md) | Checklist de auditoria visual por widget |
| [src/app/(dev)/library/](src/app/(dev)/library/) | Playground viva (tokens, badges, shells) — `npm run dev` + `/library` |
| `npm run audit:design-system` | Enforcement automático + KPIs + grade atual |

### Regras absolutas (bloqueadas pelo audit)

1. **Zero cor literal** — sempre CSS var (`bg-primary`, `text-muted-foreground`, `border-outline-variant`) ou token de `@/lib/design-system`. `bg-blue-500`, `#hex` e OKLCH inline são bloqueados.
2. **Containers via `<GlassPanel depth={1|2|3}>`** — depth 1 (widget padrão), 2 (KPI), 3 (ênfase). Dialogs/modais usam classes `glass-dialog` + `glass-dialog-overlay`.
3. **Tipografia via `<Heading level>` + `<Text variant>`** — compor `font-heading text-2xl` manualmente é bloqueado. Variantes semânticas: `page`, `section`, `card`, `kpi-value`, `label`, `meta-label`, `caption`, `overline`.
4. **Shared antes de novo** — verificar `@/components/shared/` e `@/components/ui/` (PageShell, DataShell, DialogFormShell, GlassPanel, TabPills, IconContainer, SemanticBadge, Heading, Text, BrandMark) antes de criar componente.
5. **Dark mode obrigatório** — CSS variables já têm override `.dark`. Sidebar é sempre escura em ambos os modos. Nunca criar lógica condicional manual.

Detalhes de namespace (event, portal, chat, chart, user palette, MD3 surfaces), padrões de opacidade, animação e cópia em PT-BR vivem em [design-system/README.md](design-system/README.md). Não duplicar aqui.

## Base de Dados (Supabase)

- Todas as tabelas têm **RLS**.
- Os scripts SQL situam-se em `supabase/migrations/`.
- `database.types.ts` é autogerado.

## RAG e Integração LLM Compartilhada

- Entidades cruciais ao negócio disparam hooks `after()` do backend que processam e invocam as bibliotecas internas contidas em `src/lib/ai/indexing`.
- Todas as **Server Actions publicadas** podem ser engajadas como *Ferramentas de IA* (Tools via Model Context Protocol), permitindo que agentes manipulem processos em CLI e na Web UI.

*(Para o manual estendido de comportamento do software, diagramas SSE/MCP e troubleshooting, leia `docs/architecture/AGENTS.md` e `docs/architecture/ARCHITECTURE.md` em profundidade).*
