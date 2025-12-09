# Proposta: Adicionar Avatar/Foto de Perfil para Usuários

## Why

Atualmente o sistema não permite que usuários tenham foto de perfil. A sidebar exibe apenas as iniciais do nome como fallback. Esta funcionalidade melhora a experiência visual e facilita a identificação de usuários no sistema.

## What Changes

### 1. Banco de Dados
- Adicionar coluna `avatar_url` na tabela `public.usuarios` para armazenar o path da imagem no Supabase Storage

### 2. Supabase Storage
- Configurar políticas RLS no bucket `avatar` (já existente) para:
  - Permitir upload pelo próprio usuário (authenticated)
  - Permitir upload por admins para qualquer usuário
  - Permitir leitura pública das imagens

### 3. Backend
- Criar API `POST /api/usuarios/[id]/avatar` para upload de imagem
- Criar API `DELETE /api/usuarios/[id]/avatar` para remover avatar
- Atualizar serviços de persistência para incluir `avatar_url`
- Atualizar tipos TypeScript

### 4. Frontend - Página de Perfil (`/perfil`)
- Adicionar seção de avatar no topo da página
- Permitir que o usuário faça upload/troque sua própria foto
- Exibir preview da imagem antes de salvar
- Permitir remover foto (volta para iniciais)

### 5. Frontend - Gestão de Usuários (Admin)
- No dialog de edição de usuário, adicionar campo de avatar
- Permitir que admin faça upload de foto para qualquer usuário
- Exibir avatar na listagem e detalhes do usuário

### 6. Frontend - Sidebar (NavUser)
- Já está preparado para receber avatar via props
- Atualizar `app-sidebar.tsx` para passar a URL do avatar

## Impact

### Specs Afetadas
- `usuarios` - Nova capacidade de gerenciamento de avatar

### Código Afetado
- `supabase/schemas/08_usuarios.sql` - Adicionar coluna
- `backend/usuarios/services/persistence/usuario-persistence.service.ts` - Tipos
- `app/api/usuarios/[id]/avatar/route.ts` - Nova API
- `app/api/perfil/route.ts` - Retornar avatar_url
- `app/(dashboard)/perfil/page.tsx` - Seção de avatar
- `app/(dashboard)/perfil/components/perfil-edit-sheet.tsx` - Upload de avatar
- `app/(dashboard)/usuarios/[id]/usuario-detalhes.tsx` - Exibir avatar
- `app/(dashboard)/usuarios/components/usuario-edit-dialog.tsx` - Upload admin
- `components/layout/app-sidebar.tsx` - Passar avatar para NavUser

### Storage
- Bucket: `avatar` (já existe, precisa configurar RLS)
- Estrutura de arquivos: `avatar/{user_id}.{ext}`
- Formatos aceitos: JPEG, PNG, WebP
- Tamanho máximo: 2MB
- Dimensões recomendadas: 256x256px (redimensionar no upload)
