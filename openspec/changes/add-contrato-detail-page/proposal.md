# Change: Adicionar Página de Detalhes do Contrato

## Why

Atualmente, a visualização de detalhes do contrato é feita apenas através de um Sheet lateral na listagem. Isso limita a quantidade de informações que podem ser exibidas e dificulta a navegação entre dados relacionados (financeiro, documentos, histórico). Uma página dedicada permitirá uma experiência mais completa e organizada para visualizar todas as informações do contrato.

## What Changes

- **ADDED**: Página de detalhes do contrato em `/app/contratos/[id]`
- **ADDED**: Layout com tabs (Resumo, Financeiro, Documentos, Histórico)
- **ADDED**: Componentes especializados para cada seção:
  - ContratoResumoCard: Dados do cliente e estatísticas
  - ContratoProgressCard: Progresso do workflow de status
  - ContratoTagsCard: Tags/badges do contrato
  - ContratoTimeline: Histórico de mudanças de status
  - ContratoPartesCard: Lista de partes com Sheet para detalhes
  - ContratoProcessosCard: Processos vinculados
  - ContratoFinanceiroCard: Lançamentos financeiros
  - ContratoDocumentosCard: Peças jurídicas
- **MODIFIED**: Feature financeiro para suportar filtro por `contratoId`

## Impact

- **Affected specs**:
  - `contratos` - Adiciona requisitos para página de detalhes
  - (Opcionalmente) `financeiro` - Se existir, adicionar filtro por contrato
- **Affected code**:
  - `src/app/app/contratos/[id]/` - Nova estrutura de página
  - `src/features/financeiro/domain/lancamentos.ts` - Adicionar contratoId
  - `src/features/financeiro/repository/lancamentos.ts` - Filtro por contrato
  - `src/features/contratos/actions/` - Action para buscar contrato completo
