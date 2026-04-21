# Comunica CNJ (Diário Oficial)

## Status
Módulo FSD autocontido organizado em **2 páginas**:

- **`/comunica-cnj`** → Pesquisa — hero de busca na API pública do Comunica CNJ
- **`/comunica-cnj/capturadas`** → Gestão — KPIs, filtros, listagem, vinculação de expedientes

## O que este módulo é
Consulta direta e gestão das **comunicações processuais oficiais** publicadas no Comunica CNJ (Conselho Nacional de Justiça). A página raiz é uma busca ao vivo (sem persistência); a sub-página `/capturadas` é o painel operacional sobre o que já foi sincronizado.

## Estrutura FSD

```text
comunica-cnj/
├── RULES.md                        # Regras de negócio
├── README.md                       # Este arquivo
├── index.ts                        # Barrel público
├── layout.tsx                      # PageShell wrapper
├── page.tsx                        # Pesquisa (entrypoint raiz)
├── pesquisa-client.tsx             # Client da Pesquisa
├── capturadas/
│   ├── page.tsx                    # Capturadas (sub-página)
│   └── layout.tsx                  # (opcional, herdado)
├── capturadas-client.tsx           # Client da Gestão
├── domain.ts                       # Tipos, schemas Zod
├── cnj-client.ts                   # Cliente HTTP (axios) da API CNJ
├── service.ts                      # Regras de negócio (server-only)
├── repository.ts                   # Acesso Supabase (server-only)
├── actions/
│   ├── index.ts                    # Barrel de actions
│   ├── comunica-cnj-actions.ts     # Actions com requireAuth custom
│   ├── safe-actions.ts             # Actions com authenticatedAction
│   └── utils.ts                    # requireAuth helper local
├── components/
│   ├── index.ts                    # Barrel de components
│   ├── detalhes-dialog.tsx         # Dialog de detalhes (usado nas 2 páginas)
│   ├── pdf-viewer-dialog.tsx       # Viewer PDF de certidão
│   ├── gazette-sync-dialog.tsx     # Sincronização manual (Capturadas)
│   ├── gazette-alert-banner.tsx    # Banner de prazos críticos
│   ├── gazette-orphan-resolver.tsx # Tela dedicada à aba Órfãos
│   ├── gazette-timeline.tsx        # Timeline usada no sync dialog
│   ├── pesquisa/                   # componentes da página Pesquisa
│   │   ├── search-hero.tsx         # Hero + input
│   │   ├── search-quick-filters.tsx # Tribunal, OAB, Meio, Período
│   │   ├── search-shortcuts.tsx    # Atalhos populares
│   │   ├── search-stats.tsx        # Mini-stats + link para /capturadas
│   │   └── search-results.tsx      # Lista resultados da API CNJ
│   ├── capturadas/                 # componentes da página Capturadas
│   │   ├── gazette-mission-kpi-strip.tsx # KPIs custom (sparkline, próx. prazo, taxa vinc.)
│   │   ├── capturadas-filter-bar.tsx   # StatusFilter + Fonte/Tipo/Meio/Período (padrão Audiências)
│   │   ├── capturadas-glass-list.tsx   # Cards individuais + ColumnHeaders (padrão Expedientes)
│   │   ├── capturadas-glass-cards.tsx  # Grid de cards (padrão Processos)
│   │   └── capturadas-detail-dialog.tsx # Dialog glass centralizado
│   ├── shared/
│   │   └── diario-oficial-page-nav.tsx # Heading + nav + action unificados (padrão AssinaturaDigital)
│   └── hooks/
│       ├── use-gazette-store.ts    # Zustand — estado da Gestão
│       └── use-pesquisa-store.ts   # Zustand — estado da Pesquisa
└── __tests__/
    ├── unit/                       # Testes de serviço e barrel
    └── actions/                    # Testes de server actions
```

## Fluxo de uso

1. Usuário entra em **`/comunica-cnj`** → Hero de busca.
2. Digita termo + filtros rápidos → `actionConsultarComunicacoes` consulta a API CNJ ao vivo.
3. Resultados aparecem em cards abaixo do hero. Click abre o `ComunicacaoDetalhesDialog` com opção de ver PDF da certidão.
4. Para **gerir** o que já foi sincronizado (vincular a expedientes, resolver órfãos, ver métricas), acessa **`/comunica-cnj/capturadas`** via subnav.
5. A página de Capturadas segue o padrão gold-standard de Audiências/Expedientes/Processos: `GazetteMissionKpiStrip` (KPIs custom com sparkline) → `FilterBar` (popovers, inclui StatusFilter) + `SearchInput` + `ViewToggle` → `GlassList` (cards individuais + ColumnHeaders) ou `GlassCards`.

## Agendamentos
**Fora do escopo.** Agendamentos de sincronização recorrente são gerenciados em `/captura/agendamentos/` (genéricos para todos os tipos de captura).

## Permissões RBAC
- `comunica_cnj:consultar` — consulta à API (sem persistência)
- `comunica_cnj:listar` — listar comunicações capturadas
- `comunica_cnj:capturar` — disparar sincronização manual
- `comunica_cnj:visualizar` — obter certidão PDF
- `comunica_cnj:editar` — vincular/desvincular expediente

## Tabelas Supabase
- `comunica_cnj` — comunicações capturadas
- `comunica_cnj_sync_log` — histórico de sincronizações
- `comunica_cnj_views` — views salvas por usuário
- `comunica_cnj_resumos` — resumos AI por comunicação
