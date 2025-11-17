# Change: Implementar Página de Contratos

## Why
A página de contratos atualmente é apenas um mock. Precisamos implementar uma página funcional completa que permita listar, visualizar e criar contratos, seguindo o mesmo padrão visual e arquitetural das páginas de clientes, processos e audiências.

O backend de contratos já está implementado com serviços completos (criar, listar, buscar, atualizar e gerenciar processos), mas falta a integração com o frontend e a interface de usuário.

## What Changes
- Criar hook customizado `useContratos` para integração com API de contratos
- Criar tipos TypeScript para API de contratos no frontend (`lib/types/contratos.ts`)
- Implementar página de listagem de contratos com tabela, paginação, busca e filtros avançados
- Criar componentes Sheet para visualização, edição e criação de contratos
- Criar funções utilitárias de formatação para campos de contratos
- Adicionar componente de filtros avançados para contratos
- Remover título da página (seguindo padrão das outras páginas)
- Manter consistência visual com as páginas existentes (clientes, processos, audiências)

## Impact
- Affected specs: `contratos` (nova capability)
- Affected code:
  - `app/(dashboard)/contratos/page.tsx` - Substituir mock por implementação completa
  - `lib/hooks/use-contratos.ts` - Novo hook customizado
  - `lib/types/contratos.ts` - Novos tipos para frontend
  - `lib/utils/format-contratos.ts` - Novas funções de formatação
  - `components/contratos/` - Novos componentes (view, edit, create sheets, filtros)
- Backend: Nenhuma alteração necessária (já está implementado)
- Database: Nenhuma alteração necessária (já está implementado)
