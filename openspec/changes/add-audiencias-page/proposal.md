# Change: Implementar Página de Audiências com DataTable Reutilizável

## Why
Precisamos implementar a página de audiências que lista as audiências agendadas dos processos jurídicos. Esta página seguirá o mesmo padrão arquitetural da página de processos, utilizando o componente DataTable genérico já criado. A arquitetura deve manter o desacoplamento entre front-end e back-end, seguindo princípios SOLID, KISS e YAGNI.

## What Changes
- Criar API endpoint GET `/api/audiencias` para listar audiências com:
  - Paginação server-side
  - Ordenação server-side
  - Filtros avançados (data, status, TRT, grau, responsável, processo, etc.)
  - Busca textual
- Criar serviço de backend para listar audiências do banco de dados
- Criar hook `useAudiencias` para integração com a API
- Criar tipos TypeScript para audiências e parâmetros de busca
- Implementar página de audiências (`app/(dashboard)/audiencias/page.tsx`) que:
  - Utiliza o componente DataTable genérico
  - Integra com a API `/api/audiencias`
  - Exibe campos relevantes das audiências
  - Suporta filtros e busca
- Criar componente de filtros avançados para audiências
- Organizar código por módulo/domínio seguindo arquitetura desacoplada

## Impact
- Affected specs: Nova capacidade `frontend-audiencias`
- Affected code:
  - `app/api/audiencias/route.ts` - Criar endpoint GET para listar audiências
  - `backend/audiencias/services/listar-audiencias.service.ts` - Criar serviço de listagem
  - `backend/audiencias/services/persistence/listar-audiencias.service.ts` - Criar camada de persistência
  - `backend/types/audiencias/types.ts` - Criar tipos para audiências
  - `lib/hooks/use-audiencias.ts` - Criar hook para buscar audiências
  - `lib/types/audiencias.ts` - Criar tipos para frontend
  - `app/(dashboard)/audiencias/page.tsx` - Implementar página completa
  - `components/audiencias-filtros-avancados.tsx` - Criar componente de filtros

