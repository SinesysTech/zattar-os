# Change: Implementar Página de Processos com DataTable Reutilizável

## Why
Precisamos implementar a página de processos que lista o acervo de processos jurídicos. Esta página será a base para outras páginas similares (audiências, contratos, clientes, expedientes), então o componente DataTable deve ser genérico e reutilizável. A arquitetura deve manter o desacoplamento entre front-end e back-end, seguindo princípios SOLID, YAGNI e KISS.

## What Changes
- Criar componente DataTable genérico usando TanStack Table com suporte a:
  - Paginação server-side
  - Ordenação server-side
  - Filtros e busca
  - Colunas configuráveis
  - Estados de loading e erro
- Criar hooks/services para integração com API de acervo
- Implementar página de processos (`app/(dashboard)/processos/page.tsx`) que:
  - Utiliza o componente DataTable genérico
  - Integra com a API `/api/acervo`
  - Exibe campos relevantes dos processos
  - Suporta filtros e busca
- Organizar código por módulo/domínio seguindo arquitetura desacoplada

## Impact
- Affected specs: Nova capacidade `frontend-processos`
- Affected code:
  - `components/data-table.tsx` - Refatorar para componente genérico
  - `app/(dashboard)/processos/page.tsx` - Implementar página completa
  - `lib/hooks/` ou `lib/services/` - Criar hooks/services para API
  - Tipos TypeScript para processos e tabela genérica

