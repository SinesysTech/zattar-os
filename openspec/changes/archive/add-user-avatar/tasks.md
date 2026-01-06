# Tasks: Adicionar Avatar/Foto de Perfil para Usuários

## Checklist de Implementação

### Fase 1: Infraestrutura (Banco + Storage)

- [x] **1.1** Criar migração SQL para adicionar coluna `avatar_url` na tabela `usuarios`
  - Tipo: `text`, nullable
  - Comentário descritivo

- [x] **1.2** Configurar políticas RLS no bucket `avatar` do Supabase Storage
  - Política de SELECT: bucket público (para exibir imagens)
  - Política de INSERT: usuário autenticado pode fazer upload no path `{user_id}.*`
  - Política de UPDATE: usuário pode atualizar seu próprio avatar
  - Política de DELETE: usuário pode deletar seu próprio avatar
  - Admins (is_super_admin) podem gerenciar avatares de qualquer usuário

### Fase 2: Backend

- [x] **2.1** Atualizar tipos em `usuario-persistence.service.ts`
  - Adicionar `avatarUrl: string | null` na interface `Usuario`
  - Incluir `avatar_url` na função `converterParaUsuario`

- [x] **2.2** Criar serviço de upload de avatar
  - `backend/usuarios/services/avatar/upload-avatar.service.ts`
  - Validar formato (JPEG, PNG, WebP)
  - Validar tamanho (max 2MB)
  - Fazer upload para Supabase Storage
  - Atualizar `avatar_url` na tabela usuarios
  - Deletar avatar anterior se existir

- [x] **2.3** Criar serviço de remoção de avatar
  - `backend/usuarios/services/avatar/remover-avatar.service.ts`
  - Deletar arquivo do Storage
  - Setar `avatar_url` como NULL

- [x] **2.4** Criar API route `POST /api/usuarios/[id]/avatar`
  - Autenticação obrigatória
  - Verificar permissão (próprio usuário OU admin)
  - Aceitar multipart/form-data
  - Retornar URL pública do avatar

- [x] **2.5** Criar API route `DELETE /api/usuarios/[id]/avatar`
  - Autenticação obrigatória
  - Verificar permissão (próprio usuário OU admin)

### Fase 3: Frontend - Componentes Base

- [x] **3.1** Criar componente `AvatarUpload`
  - `components/ui/avatar-upload.tsx`
  - Input de arquivo com preview
  - Suporte a drag-and-drop
  - Validação client-side (formato, tamanho)
  - Botão de remover
  - Loading state durante upload

### Fase 4: Frontend - Página de Perfil

- [x] **4.1** Atualizar `app/(dashboard)/perfil/page.tsx`
  - Adicionar seção de avatar no header (ao lado do nome)
  - Exibir avatar atual ou iniciais
  - Botão "Alterar Foto" abrindo modal

- [x] **4.2** Criar componente `AvatarEditDialog`
  - `app/(dashboard)/perfil/components/avatar-edit-dialog.tsx`
  - Usar componente `AvatarUpload`
  - Chamar API de upload
  - Feedback de sucesso/erro via toast
  - Atualizar estado após upload

### Fase 5: Frontend - Gestão de Usuários (Admin)

- [x] **5.1** Atualizar `usuario-detalhes.tsx`
  - Exibir avatar do usuário (maior, com mais destaque)
  - Dialog para admin alterar avatar
  - Botão "Editar Usuário" para abrir UsuarioEditDialog

- [x] **5.2** Atualizar `usuario-edit-dialog.tsx`
  - Adicionar seção de avatar no formulário
  - Permitir upload/remoção pelo admin via AvatarEditDialog integrado

- [x] **5.3** Atualizar `usuario-card.tsx`
  - Exibir avatar com fallback para iniciais

### Fase 6: Frontend - Sidebar

- [x] **6.1** Atualizar `app-sidebar.tsx`
  - Extrair `avatarUrl` da resposta da API `/api/perfil`
  - Gerar URL pública do Supabase Storage
  - Passar para componente `NavUser`

### Fase 7: Testes e Validação

- [ ] **7.1** Testar upload de avatar pelo próprio usuário
- [ ] **7.2** Testar upload de avatar por admin
- [ ] **7.3** Testar remoção de avatar
- [ ] **7.4** Testar exibição em todas as páginas (perfil, sidebar, detalhes)
- [ ] **7.5** Testar fallback para iniciais quando sem avatar
- [ ] **7.6** Verificar que imagem é exibida corretamente após refresh

## Notas Técnicas

### Arquitetura Implementada
- **Server Actions** ao invés de API Routes (padrão Next.js 14+)
- Bucket: `avatars` (plural)
- Storage path: `{user_id}-{timestamp}.{ext}`

### URL do Avatar
- URL pública: `{SUPABASE_URL}/storage/v1/object/public/avatars/{filename}`
- Usar função `getAvatarUrl()` de `src/features/usuarios/utils.ts`

### Validações
- Formatos: `image/jpeg`, `image/png`, `image/webp`
- Tamanho máximo: 5MB (configurado em avatar-actions.ts)
- Dimensões: Aceitar qualquer dimensão, exibir com object-fit: cover

### Segurança
- Permissão `usuarios:editar` requerida via `requireAuth()`
- Cache invalidado via `invalidateUsuariosCache()` após mudanças

## Arquivos Criados/Modificados

### Novos Arquivos (Arquitetura Atual)
- `src/features/usuarios/actions/avatar-actions.ts` - Server Actions para upload/remoção
- `src/features/usuarios/components/avatar/avatar-edit-dialog.tsx` - Dialog de edição de avatar
- `src/features/usuarios/components/avatar/cover-edit-dialog.tsx` - Dialog de edição de capa (bônus)

### Arquivos Modificados
- `src/features/usuarios/repository.ts` - Incluir avatarUrl no mapeamento
- `src/features/usuarios/utils.ts` - Função getAvatarUrl
- `src/features/perfil/components/perfil-view.tsx` - Exibir e editar avatar
- `src/features/perfil/actions/perfil-actions.ts` - Retornar avatarUrl
- `src/app/(dashboard)/usuarios/[id]/usuario-detalhes.tsx` - Avatar, capa e botão editar
- `src/features/usuarios/components/forms/usuario-edit-dialog.tsx` - Seção de avatar integrada
- `src/features/usuarios/components/shared/usuario-card.tsx` - Avatar no card
- `src/components/layout/sidebar/app-sidebar.tsx` - Passar avatar para NavUser
