# Spec Delta: Usuários - Avatar de Perfil

## Arquitetura Implementada

- **Server Actions** (`src/features/usuarios/actions/avatar-actions.ts`) para upload/remoção
- **Bucket**: `avatars` (plural)
- **Storage path**: `{user_id}-{timestamp}.{ext}`
- **Tamanho máximo**: 5MB
- **Permissão**: `usuarios:editar` requerida para upload

## ADDED Requirements

### REQ-AVATAR-001: Armazenamento de Avatar

O sistema deve armazenar a URL do avatar de cada usuário na tabela `usuarios` através de uma coluna `avatar_url`.

#### Scenario: Usuário com avatar definido
- **Given** um usuário com avatar cadastrado
- **When** os dados do usuário são consultados
- **Then** o campo `avatar_url` contém a URL completa do Supabase Storage

#### Scenario: Usuário sem avatar
- **Given** um usuário sem avatar cadastrado
- **When** os dados do usuário são consultados
- **Then** o campo `avatar_url` é `NULL`

---

### REQ-AVATAR-002: Upload de Avatar pelo Próprio Usuário

O usuário autenticado pode fazer upload de sua própria foto de perfil através da página `/perfil`.

#### Scenario: Upload bem-sucedido
- **Given** um usuário autenticado na página de perfil
- **When** o usuário seleciona uma imagem válida (JPEG/PNG/WebP, max 5MB)
- **And** confirma o upload via `AvatarEditDialog`
- **Then** a Server Action `actionUploadAvatar` é chamada
- **And** a imagem é salva no Supabase Storage bucket `avatars`
- **And** o campo `avatar_url` é atualizado na tabela `usuarios`
- **And** o cache é invalidado via `invalidateUsuariosCache()`
- **And** o avatar é exibido imediatamente na página e na sidebar

#### Scenario: Upload com formato inválido
- **Given** um usuário autenticado na página de perfil
- **When** o usuário tenta fazer upload de um arquivo não-imagem (PDF, DOC, etc.)
- **Then** o sistema exibe mensagem de erro "Formato não suportado. Use JPEG, PNG ou WebP."
- **And** o upload não é realizado

#### Scenario: Upload com tamanho excedido
- **Given** um usuário autenticado na página de perfil
- **When** o usuário tenta fazer upload de imagem maior que 5MB
- **Then** o sistema exibe mensagem de erro "Arquivo muito grande (máx 5MB)"
- **And** o upload não é realizado

---

### REQ-AVATAR-003: Upload de Avatar por Administrador

Administradores podem fazer upload de avatar para qualquer usuário através da gestão de usuários.

#### Scenario: Admin altera avatar via página de detalhes
- **Given** um administrador na página de detalhes de um usuário (`/usuarios/[id]`)
- **When** o admin clica no avatar (com overlay de câmera)
- **And** seleciona uma imagem válida via `AvatarEditDialog`
- **Then** a Server Action `actionUploadAvatar` é chamada
- **And** a imagem é salva no Supabase Storage bucket `avatars`
- **And** o campo `avatar_url` do usuário alvo é atualizado

#### Scenario: Admin altera avatar via dialog de edição
- **Given** um administrador editando um usuário via `UsuarioEditDialog`
- **When** o admin clica na seção de avatar
- **And** seleciona uma imagem válida via `AvatarEditDialog` integrado
- **Then** o avatar é atualizado imediatamente

#### Scenario: Usuário sem permissão tenta alterar avatar de outro
- **Given** um usuário sem permissão `usuarios:editar`
- **When** tenta fazer upload de avatar para outro usuário
- **Then** o sistema retorna erro de permissão
- **And** o upload não é realizado

---

### REQ-AVATAR-004: Remoção de Avatar

Usuários podem remover seu próprio avatar. Administradores podem remover avatar de qualquer usuário.

#### Scenario: Usuário remove próprio avatar
- **Given** um usuário autenticado com avatar cadastrado
- **When** o usuário clica em "Remover foto" na página de perfil
- **And** confirma a remoção
- **Then** o arquivo é deletado do Supabase Storage
- **And** o campo `avatar_url` é setado como `NULL`
- **And** a sidebar passa a exibir as iniciais do nome

#### Scenario: Admin remove avatar de usuário
- **Given** um administrador na página de detalhes de um usuário com avatar
- **When** o admin clica em "Remover foto"
- **And** confirma a remoção
- **Then** o avatar do usuário é removido
- **And** a alteração é registrada em `logs_alteracao`

---

### REQ-AVATAR-005: Exibição de Avatar na Sidebar

O avatar do usuário logado deve ser exibido no footer da sidebar (componente NavUser).

#### Scenario: Usuário com avatar na sidebar
- **Given** um usuário autenticado com avatar cadastrado
- **When** qualquer página do dashboard é carregada
- **Then** o avatar é exibido no footer da sidebar (8x8, rounded-lg)
- **And** o avatar é exibido no dropdown menu quando aberto

#### Scenario: Usuário sem avatar na sidebar
- **Given** um usuário autenticado sem avatar
- **When** qualquer página do dashboard é carregada
- **Then** as iniciais do nome são exibidas como fallback
- **And** o fundo usa cor do tema (muted)

---

### REQ-AVATAR-006: Exibição de Avatar na Página de Perfil

A página de perfil deve exibir o avatar do usuário de forma destacada.

#### Scenario: Avatar no header do perfil
- **Given** um usuário com avatar na página `/perfil`
- **When** a página é carregada
- **Then** o avatar é exibido ao lado do nome (tamanho maior, ~96px)
- **And** há um botão/ícone para "Alterar foto"

#### Scenario: Sem avatar no header do perfil
- **Given** um usuário sem avatar na página `/perfil`
- **When** a página é carregada
- **Then** um placeholder com iniciais é exibido
- **And** há um botão/ícone para "Adicionar foto"

---

### REQ-AVATAR-007: Exibição de Avatar na Gestão de Usuários

A página de gestão de usuários (admin) deve exibir avatares na listagem e detalhes.

#### Scenario: Avatar nos cards de usuários
- **Given** um admin na página `/usuarios`
- **When** a listagem de cards é carregada
- **Then** cada `UsuarioCard` exibe avatar (40x40px) ou iniciais como fallback

#### Scenario: Avatar nos detalhes do usuário
- **Given** um admin na página `/usuarios/[id]`
- **When** a página é carregada
- **Then** o avatar do usuário é exibido de forma destacada (96x96px) com overlay de câmera
- **And** há botão "Editar Usuário" para abrir `UsuarioEditDialog`
- **And** há opção para o admin alterar o avatar clicando na imagem

#### Scenario: Edição de dados cadastrais pelo admin
- **Given** um admin na página `/usuarios/[id]`
- **When** clica no botão "Editar Usuário"
- **Then** o `UsuarioEditDialog` é aberto
- **And** o dialog exibe seção de avatar no topo com opção de alterar
- **And** o admin pode editar todos os dados cadastrais do usuário

---

### REQ-AVATAR-008: Substituição de Avatar

Ao fazer upload de novo avatar, o anterior deve ser substituído automaticamente.

#### Scenario: Substituir avatar existente
- **Given** um usuário com avatar cadastrado
- **When** faz upload de nova imagem
- **Then** o arquivo anterior é deletado do Storage
- **And** o novo arquivo é salvo
- **And** o campo `avatar_url` é atualizado com novo path
- **And** a URL inclui timestamp para invalidar cache

---

### REQ-AVATAR-009: Políticas de Acesso ao Storage

O bucket `avatars` deve ter políticas configuradas para acesso público de leitura.

#### Scenario: Leitura pública de avatares
- **Given** qualquer requisição (autenticada ou não)
- **When** tenta acessar URL de avatar no bucket `avatars`
- **Then** a imagem é retornada (bucket configurado como público)

#### Scenario: Upload via Server Action
- **Given** um usuário com permissão `usuarios:editar`
- **When** chama `actionUploadAvatar` via Server Action
- **Then** o upload é feito usando `createServiceClient()` (service role)
- **And** o arquivo é salvo com nome `{user_id}-{timestamp}.{ext}`

#### Scenario: Controle de permissão no backend
- **Given** um usuário sem permissão `usuarios:editar`
- **When** tenta chamar `actionUploadAvatar`
- **Then** a função `requireAuth(['usuarios:editar'])` bloqueia a ação
- **And** retorna erro de permissão
