# Change: Implementar Página de Expedientes (Pendentes de Manifestação)

## Why
Precisamos implementar a página de expedientes que lista processos pendentes de manifestação. Esta página será utilizada pelos advogados para visualizar, filtrar e gerenciar expedientes que aguardam resposta. A página deve seguir o mesmo padrão visual e arquitetural das páginas de processos e audiências já implementadas, garantindo consistência na experiência do usuário e facilitando manutenção futura.

## What Changes
- Criar hook `usePendentes` para integração com API `/api/pendentes-manifestacao`
- Criar tipos TypeScript para filtros de expedientes (`ExpedientesFilters`)
- Criar componente `ExpedientesFiltrosAvancados` seguindo padrão de `ProcessosFiltrosAvancados`
- Implementar página de expedientes (`app/(dashboard)/expedientes/page.tsx`) que:
  - Utiliza o componente DataTable genérico já existente
  - Integra com a API `/api/pendentes-manifestacao`
  - Exibe campos relevantes dos expedientes (incluindo novos campos de baixa)
  - Suporta filtros específicos de expedientes (prazo vencido, datas de prazo legal, etc.)
  - Suporta busca textual em múltiplos campos
  - Suporta ordenação e paginação server-side
- Criar componente `ExpedienteVisualizarDialog` para exibir detalhes completos do expediente em um diálogo organizado
- Adicionar botão de visualizar (ícone Eye) na coluna de ações da tabela de expedientes
- Adicionar botão "Abrir Expediente" no diálogo de visualização (preparado para navegação futura para página dedicada)
- Atualizar tipos TypeScript para incluir campos de baixa (`baixado_em`, `protocolo_id`, `justificativa_baixa`)
- Organizar código por módulo/domínio seguindo arquitetura desacoplada

## Impact
- Affected specs: Nova capacidade `frontend-expedientes`
- Affected code:
  - `lib/hooks/use-pendentes.ts` - Novo hook para buscar expedientes
  - `lib/types/expedientes.ts` - Novos tipos para filtros e resposta da API
  - `components/expedientes-filtros-avancados.tsx` - Novo componente de filtros
  - `components/expediente-visualizar-dialog.tsx` - Novo componente de diálogo de visualização
  - `app/(dashboard)/expedientes/page.tsx` - Nova página completa
  - `components/expedientes-visualizacao-semana.tsx` - Atualizado para incluir botão de visualizar
  - `backend/types/pendentes/types.ts` - Atualizar interface para incluir campos de baixa


