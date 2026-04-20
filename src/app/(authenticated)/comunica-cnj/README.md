# Comunica CNJ (Diário Oficial)

## Status
Módulo FSD autocontido. Toda lógica (domain, service, repository, client HTTP, actions, components, hooks, testes) vive aqui.

## O que este módulo é
Rota `/comunica-cnj` — "Diário Oficial" — que consulta a **API pública do Comunica CNJ** (Conselho Nacional de Justiça) para obter comunicações processuais oficiais, persiste as capturas em banco e vincula automaticamente a expedientes correspondentes.

## Estrutura FSD

```text
comunica-cnj/
├── RULES.md                  # Regras de negócio
├── README.md                 # Este arquivo
├── index.ts                  # Barrel público (importar via @/app/(authenticated)/comunica-cnj)
├── layout.tsx                # PageShell wrapper
├── page.tsx                  # Entry da rota
├── domain.ts                 # Tipos, schemas Zod
├── cnj-client.ts             # Cliente HTTP (axios) da API pública do CNJ
├── service.ts                # Regras de negócio (server-only)
├── repository.ts             # Acesso Supabase (server-only)
├── actions/
│   ├── index.ts              # Barrel de actions
│   ├── comunica-cnj-actions.ts   # Actions com requireAuth custom (legacy)
│   ├── safe-actions.ts       # Actions com authenticatedAction (safe-action)
│   └── utils.ts              # requireAuth helper local
├── components/
│   ├── index.ts              # Barrel de componentes
│   ├── tabs-content.tsx      # Entrypoint client (Suspense + GazettePage)
│   ├── gazette-page.tsx      # Orquestrador principal
│   ├── gazette-*.tsx         # 20+ componentes UI
│   ├── detalhes-dialog.tsx
│   ├── pdf-viewer-dialog.tsx
│   ├── results-table.tsx
│   └── hooks/
│       ├── use-gazette-store.ts
│       └── use-gazette-keyboard.ts
└── __tests__/
    ├── unit/                 # Testes de serviço e domínio
    └── actions/              # Testes de server actions
```

## Diferença vs. módulo `captura`

| | Comunica CNJ | Captura |
|---|---|---|
| Fonte | API pública REST do CNJ | Scraping Playwright do PJE/TRT |
| Auth externa | Nenhuma (API aberta) | Credenciais de advogado (cpf/senha) |
| Entidade principal | `ComunicacaoCNJ` | `ProcessoCapturado`, `Audiencia`, etc. |
| Agendamento | Via `captura/agendamentos/` (genérico) | Via `captura/agendamentos/` (genérico) |

## Permissões RBAC
- `comunica_cnj:consultar` — consulta à API (sem persistência)
- `comunica_cnj:listar` — listar comunicações capturadas
- `comunica_cnj:capturar` — disparar sincronização manual
- `comunica_cnj:visualizar` — obter certidão PDF
- `comunica_cnj:editar` — vincular/desvincular expediente

## Dependências externas do projeto
- `captura/agendamentos/` — agendamentos genéricos (não acoplar lógica de comunica aqui)
- `expedientes/` — para criar expediente a partir de comunicação não-vinculada
- `@/lib/safe-action` — wrapper para server actions modernas
- `@/lib/supabase/service-client` — acesso direto ao banco

## Tabelas Supabase
- `comunica_cnj` — comunicações capturadas
- `comunica_cnj_sync_log` — histórico de sincronizações
- `comunica_cnj_views` — views salvas por usuário
- `comunica_cnj_resumos` — resumos AI por comunicação
