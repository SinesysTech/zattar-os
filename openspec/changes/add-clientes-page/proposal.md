# Change: Implementar Front-end da Página de Clientes

## Why
A página de clientes precisa de uma interface front-end completa para visualização e gerenciamento de clientes (pessoas físicas e jurídicas). As rotas de API já estão implementadas e funcionais, mas falta a interface do usuário que permita aos usuários listar, visualizar e editar clientes de forma intuitiva e consistente com o restante do sistema.

## What Changes
- Criação da página de listagem de clientes (`app/(dashboard)/clientes/page.tsx`)
- Implementação de hook customizado para buscar clientes (`lib/hooks/use-clientes.ts`)
- Criação de tipos TypeScript para o front-end (`lib/types/clientes.ts`)
- Componente de visualização de cliente (Dialog ou Sheet)
- Componente de edição de cliente (Dialog ou Sheet)
- Colunas da tabela com ordenação e filtros
- Integração com DataTable seguindo padrão da página de processos
- Suporte a busca, paginação e filtros avançados

## Impact
- Affected specs: Nova capacidade `clientes-frontend`
- Affected code:
  - `app/(dashboard)/clientes/page.tsx` (criação)
  - `lib/hooks/use-clientes.ts` (criação)
  - `lib/types/clientes.ts` (criação)
  - `components/clientes/` (criação de componentes modulares)
- Dependencies: Utiliza APIs existentes em `app/api/clientes/`

