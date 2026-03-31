# Plano de Implementação: Contratos — Mock → Produção

## Visão Geral

Substituir a página mock (`/app/contratos/mock`) por implementação real com dados do back-end, seguindo o padrão estabelecido em Partes (server component + client component + hook unificado + adapter).

**Total: 7 arquivos novos, 7 modificados.**

---

## O que já existe (reutilizável)

| Recurso | Arquivo |
|---------|---------|
| `listarContratos(params)` | `features/contratos/service.ts` |
| `contarContratosPorStatus()` | `features/contratos/service.ts` |
| `contarContratos()` | `features/contratos/service.ts` |
| `actionListarContratos` | `features/contratos/actions/contratos-actions.ts` |
| `actionContarContratosPorStatus` | `features/contratos/actions/contratos-actions.ts` |
| `actionResolverNomesEntidadesContrato` | `features/contratos/actions/contratos-actions.ts` |
| `useContratos(params)` | `features/contratos/hooks/` |
| `useKanbanContratos(segmentoId)` | `features/contratos/hooks/` |
| `useSegmentos()` | `features/contratos/hooks/` |

## Componentes compartilhados reutilizados

| Componente | Uso |
|------------|-----|
| GlassPanel | Cards, funnel, strips |
| TabPills | Filtro de segmentos |
| SearchInput | Busca |
| ViewToggle | Estender para 3 modos |
| InsightBanner | Alerta de contratos travados |
| ProgressRing | Taxa de conversão |
| Sparkline | Tendência 6 meses |
| AnimatedNumber | Valores financeiros |

---

## Implementação por camada

### Camada 1: Repository (sem dependências)

| # | Arquivo | Ação | Complexidade |
|---|---------|------|-------------|
| 1 | `features/contratos/repository.ts` | MODIFICAR — add `countContratosNovosMes()` e `countContratosTrendMensal(months)` | Baixa |

### Camada 2: Server Actions

| # | Arquivo | Ação | Complexidade |
|---|---------|------|-------------|
| 2 | `features/contratos/actions/contratos-actions.ts` | MODIFICAR — add `actionContratosStats()` | Média |

### Camada 3: Componente compartilhado

| # | Arquivo | Ação | Complexidade |
|---|---------|------|-------------|
| 3 | `components/dashboard/view-toggle.tsx` | MODIFICAR — aceitar `options` genérico para 3+ modos | Baixa |

### Camada 4: Adapter

| # | Arquivo | Ação | Complexidade |
|---|---------|------|-------------|
| 4 | `features/contratos/adapters/contrato-card-adapter.ts` | CRIAR — `contratoToCardData()` + `ContratoCardData` type + `computeDiasNoEstagio()` | Média |

### Camada 5: Hooks

| # | Arquivo | Ação | Complexidade |
|---|---------|------|-------------|
| 5 | `features/contratos/hooks/use-contratos-page.ts` | CRIAR — hook unificado (fetch + resolve nomes + adapter) | Média |
| 6 | `features/contratos/hooks/use-contratos-stats.ts` | CRIAR — fetch stats pipeline | Baixa |
| 7 | `features/contratos/hooks/index.ts` | MODIFICAR — exportar novos hooks | Baixa |

### Camada 6: Componentes visuais

| # | Arquivo | Ação | Complexidade |
|---|---------|------|-------------|
| 8 | `features/contratos/components/contrato-card.tsx` | CRIAR — card glass para kanban/grid | Baixa |
| 9 | `features/contratos/components/contrato-list-row.tsx` | CRIAR — row para vista lista | Baixa |
| 10 | `features/contratos/components/pipeline-funnel.tsx` | CRIAR — funil com taxas de conversão | Média |
| 11 | `features/contratos/components/financial-strip.tsx` | CRIAR — strip financeiro (KPIs) | Baixa |
| 12 | `features/contratos/components/kanban-column.tsx` | CRIAR — coluna kanban com overlay financeiro | Baixa |

### Camada 7: Páginas

| # | Arquivo | Ação | Complexidade |
|---|---------|------|-------------|
| 13 | `app/app/contratos/contratos-client.tsx` | CRIAR — client component principal | Alta |
| 14 | `app/app/contratos/page.tsx` | MODIFICAR — server component com stats iniciais | Média |

---

## Fluxo de dados

```
page.tsx (Server)
  ├── actionContratosStats()        → stats iniciais
  ├── fetchSegmentosAtivos()        → lista de segmentos
  └── <ContratosClient initialStats={} segmentos={} />
        ├── useContratosPage(params)
        │     ├── actionListarContratos()
        │     ├── actionResolverNomesEntidadesContrato()
        │     └── contratoToCardData()  → ContratoCardData[]
        ├── useContratosStats()
        │     └── actionContratosStats()
        └── RENDER:
              ├── FinancialStrip
              ├── PipelineFunnel
              ├── InsightBanner (contratos travados)
              ├── TabPills + SearchInput + ViewToggle
              └── Pipeline | Kanban | Lista (conforme viewMode)
```

## Decisão crítica: valores financeiros

O tipo `Contrato` não tem campo `valor`. Opções:
1. Adicionar coluna `valor_estimado` na tabela
2. Integrar com módulo financeiro (lancamentos)
3. v1 sem valores — mostrar apenas contagens e conversão

**Recomendação:** v1 com contagens. Valores financeiros quando `valor_estimado` ou integração financeira estiverem prontos.
