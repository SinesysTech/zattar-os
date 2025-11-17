# Change: Implementar Página de Usuários com Visualização em Cards e Tabela

## Why
A página de usuários precisa de uma interface front-end completa para visualização e gerenciamento de usuários do sistema. As rotas de API já estão implementadas e funcionais, mas falta a interface do usuário que permita aos usuários listar, visualizar e editar usuários de forma intuitiva. Além disso, é necessário oferecer duas formas de visualização (cards e tabela) para melhorar a experiência do usuário, permitindo que escolham a visualização mais adequada ao seu fluxo de trabalho.

## What Changes
- Criação da página de listagem de usuários (`app/(dashboard)/usuarios/page.tsx`)
- Atualização do hook customizado para buscar usuários com paginação e filtros (`lib/hooks/use-usuarios.ts`)
- Criação de tipos TypeScript para o front-end (`lib/types/usuarios.ts`)
- Componente de visualização em cards (`components/usuarios/usuario-card.tsx`)
- Componente de visualização em tabela (colunas para DataTable)
- Componente de alternância de visualização (`components/usuarios/view-toggle.tsx`)
- Componente de visualização de usuário (Sheet) (`components/usuarios/usuario-view-sheet.tsx`)
- Componente de edição de usuário (Sheet) (`components/usuarios/usuario-edit-sheet.tsx`)
- Componente de filtros avançados (`components/usuarios/usuarios-filtros-avancados.tsx`)
- Integração com DataTable seguindo padrão da página de clientes
- Suporte a busca, paginação e filtros avançados
- Persistência da preferência de visualização (localStorage)

## Impact
- Affected specs: Nova capacidade `usuarios-frontend`
- Affected code:
  - `app/(dashboard)/usuarios/page.tsx` (criação)
  - `lib/hooks/use-usuarios.ts` (modificação)
  - `lib/types/usuarios.ts` (criação)
  - `components/usuarios/` (criação de componentes modulares)
- Dependencies: Utiliza APIs existentes em `app/api/usuarios/`

