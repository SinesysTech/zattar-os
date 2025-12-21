# Design: Refatorar Layout do Módulo de Audiências

## Context

O módulo de Expedientes estabeleceu um padrão de layout bem-sucedido com:
- Tabs estilo Chrome integradas com carrosséis temporais
- Barra de filtros inline
- Navegação fluida entre visualizações (dia, mês, ano, lista)
- Componentização clara e manutenível

O módulo de Audiências, implementado antes da padronização, usa uma abordagem diferente:
- `TemporalViewShell` para gerenciamento de visualizações
- Carrosséis internos em cada componente de visualização
- Filtros separados em componente dedicado
- Tipos duplicados em múltiplos arquivos

Esta refatoração alinha Audiências com o padrão Expedientes para consistência e manutenibilidade.

## Goals / Non-Goals

### Goals
- Alinhar layout de Audiências com padrão Expedientes
- Eliminar duplicação de tipos
- Melhorar experiência do usuário com navegação consistente
- Facilitar manutenção futura com componentes padronizados
- Manter 100% das funcionalidades existentes

### Non-Goals
- Não alterar lógica de backend (actions, service, repository)
- Não alterar APIs existentes
- Não adicionar novas funcionalidades
- Não alterar regras de negócio

## Decisions

### Decision 1: Consolidar tipos em domain.ts
**O quê:** Mover todos os tipos de Audiências para `domain.ts`
**Por quê:** Elimina duplicação, facilita imports, mantém single source of truth

### Decision 2: Usar padrão Expedientes para layout
**O quê:** Refatorar `audiencias-content.tsx` para usar tabs Chrome-style + carrosséis integrados
**Por quê:** Consistência visual, melhor UX, código mais manutenível

**Alternativas consideradas:**
- Manter `TemporalViewShell`: Rejeitado porque diverge do padrão e duplica lógica
- Criar novo shell genérico: Rejeitado por over-engineering

### Decision 3: Carrosséis gerenciados pelo parent
**O quê:** Remover carrosséis internos dos componentes de calendário
**Por quê:** Mantém estado centralizado, facilita sincronização, reduz complexidade

### Decision 4: Criar audiencias-table-wrapper para visualização "dia"
**O quê:** Novo componente similar a `expedientes-table-wrapper.tsx`
**Por quê:** Substitui `audiencias-calendar-week-view.tsx` com padrão consistente

### Decision 5: Criar filtros toolbar inline
**O quê:** Novo componente `audiencias-toolbar-filters.tsx` com filtros inline
**Por quê:** Substitui `audiencias-calendar-filters.tsx` com padrão Expedientes

## Risks / Trade-offs

### Risk 1: Quebra de funcionalidade durante refatoração
**Mitigação:** Implementar em fases, testar cada etapa antes de prosseguir

### Risk 2: Regressões visuais
**Mitigação:** Comparar visualmente antes/depois, validar responsividade

### Risk 3: Imports quebrados após remoção de arquivos
**Mitigação:** Buscar todos os imports antes de remover, atualizar sistematicamente

## Migration Plan

### Fase 1: Consolidação de Tipos (baixo risco)
1. Adicionar tipos consolidados em `domain.ts`
2. Atualizar imports gradualmente
3. Remover arquivos duplicados

### Fase 2: Layout Base (médio risco)
1. Refatorar `audiencias-content.tsx`
2. Criar novos componentes (table-wrapper, toolbar-filters)
3. Testar navegação

### Fase 3: Calendários (médio risco)
1. Refatorar month-view e year-view
2. Remover componentes obsoletos
3. Testar visualizações

### Fase 4: Refinamento (baixo risco)
1. Revisar componentes UI
2. Atualizar páginas
3. Testes finais

### Rollback
- Cada fase pode ser revertida independentemente via git
- Componentes antigos mantidos até validação completa
- Nenhuma migração de dados necessária

## Open Questions

- Nenhuma questão em aberto. Padrão Expedientes está bem documentado e testado.

## Architecture Diagram

```
AudienciasContent (refatorado)
├── Tabs Chrome-style
│   ├── Tab "Dia" + DaysCarousel
│   ├── Tab "Mês" + MonthsCarousel
│   ├── Tab "Ano" + YearsCarousel
│   └── Tab "Lista"
├── AudienciasToolbarFilters (novo)
│   ├── Filtros inline (TRT, Grau, Status, etc.)
│   └── Busca integrada
└── Visualizações
    ├── AudienciasTableWrapper (novo) - "dia"
    ├── AudienciasCalendarMonthView (refatorado) - "mês"
    ├── AudienciasCalendarYearView (refatorado) - "ano"
    └── AudienciasListWrapper - "lista"
```
