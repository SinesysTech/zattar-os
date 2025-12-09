# Spec Delta: Usuários - Avatar de Perfil

## ADDED Requirements

### REQ-AVATAR-001: Armazenamento de Avatar

O sistema deve armazenar a URL do avatar de cada usuário na tabela `usuarios` através de uma coluna `avatar_url`.

#### Scenario: Usuário com avatar definido
- **Given** um usuário com avatar cadastrado
- **When** os dados do usuário são consultados
- **Then** o campo `avatar_url` contém o path relativo no Supabase Storage

#### Scenario: Usuário sem avatar
- **Given** um usuário sem avatar cadastrado
- **When** os dados do usuário são consultados
- **Then** o campo `avatar_url` é `NULL`

---

### REQ-AVATAR-002: Upload de Avatar pelo Próprio Usuário

O usuário autenticado pode fazer upload de sua própria foto de perfil através da página `/perfil`.

#### Scenario: Upload bem-sucedido
- **Given** um usuário autenticado na página de perfil
- **When** o usuário seleciona uma imagem válida (JPEG/PNG/WebP, max 2MB)
- **And** confirma o upload
- **Then** a imagem é salva no Supabase Storage no path `avatar/{user_id}.{ext}`
- **And** o campo `avatar_url` é atualizado na tabela `usuarios`
- **And** o avatar é exibido imediatamente na página e na sidebar

#### Scenario: Upload com formato inválido
- **Given** um usuário autenticado na página de perfil
- **When** o usuário tenta fazer upload de um arquivo não-imagem (PDF, DOC, etc.)
- **Then** o sistema exibe mensagem de erro "Formato não suportado. Use JPEG, PNG ou WebP."
- **And** o upload não é realizado

#### Scenario: Upload com tamanho excedido
- **Given** um usuário autenticado na página de perfil
- **When** o usuário tenta fazer upload de imagem maior que 2MB
- **Then** o sistema exibe mensagem de erro "Imagem muito grande. Tamanho máximo: 2MB."
- **And** o upload não é realizado

---

### REQ-AVATAR-003: Upload de Avatar por Administrador

Administradores podem fazer upload de avatar para qualquer usuário através da gestão de usuários.

#### Scenario: Admin altera avatar de outro usuário
- **Given** um administrador na página de detalhes de um usuário
- **When** o admin seleciona uma imagem válida para o usuário
- **And** confirma o upload
- **Then** a imagem é salva no Supabase Storage
- **And** o campo `avatar_url` do usuário alvo é atualizado
- **And** a alteração é registrada em `logs_alteracao`

#### Scenario: Usuário comum tenta alterar avatar de outro
- **Given** um usuário comum autenticado
- **When** tenta fazer upload de avatar para outro usuário via API
- **Then** o sistema retorna erro 403 Forbidden
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

#### Scenario: Avatar na listagem de usuários
- **Given** um admin na página `/usuarios`
- **When** a listagem é carregada
- **Then** cada usuário exibe seu avatar ou iniciais na coluna correspondente

#### Scenario: Avatar nos detalhes do usuário
- **Given** um admin na página `/usuarios/[id]`
- **When** a página é carregada
- **Then** o avatar do usuário é exibido de forma destacada no header
- **And** há opção para o admin alterar o avatar

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

O bucket `avatar` deve ter políticas RLS configuradas corretamente.

#### Scenario: Leitura pública de avatares
- **Given** qualquer requisição (autenticada ou não)
- **When** tenta acessar URL de avatar
- **Then** a imagem é retornada (acesso público para leitura)

#### Scenario: Upload restrito ao próprio usuário
- **Given** um usuário autenticado
- **When** tenta fazer upload no path `avatar/{outro_user_id}/*`
- **Then** o upload é negado (403)

#### Scenario: Upload permitido para próprio path
- **Given** um usuário autenticado
- **When** tenta fazer upload no path `avatar/{proprio_user_id}/*`
- **Then** o upload é permitido

#### Scenario: Admin pode fazer upload em qualquer path
- **Given** um admin autenticado (is_super_admin = true)
- **When** tenta fazer upload em qualquer path
- **Then** o upload é permitido
