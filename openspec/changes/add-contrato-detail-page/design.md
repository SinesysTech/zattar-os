# Design: Página de Detalhes do Contrato

## Context

A página de listagem de contratos usa um Sheet para visualização de detalhes. Este approach é limitado para contratos que possuem muitas informações relacionadas (partes, processos, financeiro, documentos, histórico). Uma página dedicada permite melhor organização e navegação.

**Stakeholders**: Advogados, assistentes jurídicos, gestão financeira.

## Goals / Non-Goals

### Goals
- Visualização completa de todas as informações do contrato
- Navegação organizada por tabs (Resumo, Financeiro, Documentos, Histórico)
- Acesso rápido a dados relacionados sem sair da página
- Manter consistência visual com outras páginas do sistema

### Non-Goals
- Edição inline de dados (manter formulário em Sheet existente)
- Substituir o Sheet de visualização rápida na listagem
- Criar nova estrutura de feature (usar features existentes)

## Decisions

### Layout de Tabs
**Decision**: Usar 4 tabs (Resumo, Financeiro, Documentos, Histórico)
**Rationale**: Agrupa informações por contexto, reduz scroll, permite lazy loading

### Tab Resumo - Grid 3 colunas
**Decision**: Coluna esquerda (1/3) com cards de resumo, coluna direita (2/3) com partes e processos
**Rationale**: Mantém consistência com template existente, prioriza informações mais acessadas

### Visualização de Partes
**Decision**: Ao clicar em uma parte, abrir Sheet lateral (não redirecionar)
**Rationale**: Permite visualizar detalhes sem perder contexto do contrato

### Carregamento de Dados
**Decision**: Server Component com fetch paralelo de todas as entidades relacionadas
**Rationale**: Performance otimizada, dados prontos no primeiro render

### Filtro de Financeiro por Contrato
**Decision**: Adicionar `contratoId` ao `ListarLancamentosParams` existente
**Rationale**: Mudança mínima, reutiliza infraestrutura existente

## Risks / Trade-offs

### Risco: Performance com muitos dados relacionados
**Mitigation**: Lazy loading de tabs secundárias, paginação em tabelas

### Risco: Inconsistência com Sheet existente
**Mitigation**: Manter Sheet para visualização rápida, página para análise detalhada

### Trade-off: Complexidade vs Completude
**Choice**: Implementar todas as seções de uma vez para evitar página incompleta

## Data Flow

```
page.tsx (Server Component)
├── actionBuscarContrato(id) → Contrato + partes + processos + histórico
├── actionBuscarCliente(clienteId) → Cliente completo
├── actionListarLancamentos({ contratoId }) → Financeiro
└── actionListarDocumentosDoContrato({ contratoId }) → Documentos

Client Components
├── ContratoResumoCard → cliente, stats
├── ContratoPartesCard → partes[] → onClick → ParteViewSheet
├── ContratoTimeline → statusHistorico[]
├── ContratoFinanceiroCard → lancamentos[]
└── ContratoDocumentosCard → ContratoDocumentosList (existente)
```

## File Structure

```
src/app/app/contratos/[id]/
├── page.tsx                    # Server Component principal
├── loading.tsx                 # Skeleton loading
├── error.tsx                   # Error boundary
├── not-found.tsx               # 404
└── components/
    ├── index.ts                # Barrel export
    ├── contrato-detalhes-header.tsx
    ├── contrato-resumo-card.tsx
    ├── contrato-progress-card.tsx
    ├── contrato-tags-card.tsx
    ├── contrato-timeline.tsx
    ├── contrato-partes-card.tsx
    ├── contrato-processos-card.tsx
    ├── contrato-financeiro-card.tsx
    ├── contrato-documentos-card.tsx
    └── parte-view-sheet.tsx
```

## Migration Plan

1. Criar infraestrutura (filtro financeiro, action)
2. Criar componentes individualmente
3. Montar página com tabs
4. Adicionar link na listagem de contratos (coluna de ações)
5. Remover componentes template
6. Testar fluxo completo

**Rollback**: Reverter commits se problemas críticos encontrados.

## Open Questions

- Nenhuma questão pendente. Todas as decisões foram tomadas com base nas respostas do usuário.
