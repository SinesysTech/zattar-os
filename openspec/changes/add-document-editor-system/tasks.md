# Tasks: Sistema de Editor de Documentos

## 🔴 PRIORIDADE ALTA - MVP Funcional (28-36 horas)

### Navegação (1h)
- [x] Reorganizar `components/layout/app-sidebar.tsx` em 3 seções
  - [x] Criar array `navPrincipal` com itens atuais (Dashboard, Partes, Contratos, etc)
  - [x] Criar array `navServicos` com "Editor de Documentos" e "Chat Interno"
  - [x] Criar array `navAdministracao` com "Captura" (movido) e "Usuários"
  - [x] Renderizar 3 seções na sidebar com títulos apropriados

### Banco de Dados - Migrations + RLS (2-3h)
- [x] Criar migration `20251130220000_create_documentos_system.sql`
  - [x] Tabela `documentos` com todos os campos, constraints e índices
  - [x] Tabela `pastas` com self-referencing e trigger de validação de ciclos
  - [x] Tabela `documentos_compartilhados` com constraint unique
  - [x] Tabela `templates` com campos de visibilidade
  - [x] Tabela `documentos_uploads` para rastreamento B2
  - [x] Tabela `documentos_versoes` para histórico
  - [x] Tabela `salas_chat` para salas de chat
  - [x] Tabela `mensagens_chat` para mensagens
  - [x] Função `validate_pasta_hierarchy()` para prevenir ciclos
  - [x] Trigger `validate_pasta_hierarchy_trigger`
  - [x] Função `update_updated_at_column()` para timestamps
- [x] Criar RLS policies para todas as tabelas (4 policies por tabela: select, insert, update, delete)
- [x] Testar migration em ambiente local (aplicada via Supabase MCP)
- [x] Aplicar migration via Supabase MCP (inclui índices e fix de policies)

### Tipos TypeScript (1h)
- [x] Criar `backend/types/documentos/types.ts`
  - [x] Interface `Documento`
  - [x] Interface `CriarDocumentoParams`
  - [x] Interface `AtualizarDocumentoParams`
  - [x] Interface `ListarDocumentosParams`
  - [x] Interface `DocumentoComUsuario`
  - [x] Interface `Pasta`
  - [x] Interface `CriarPastaParams`
  - [x] Interface `AtualizarPastaParams`
  - [x] Interface `DocumentoCompartilhado`
  - [x] Interface `CompartilharDocumentoParams`
  - [x] Interface `Template`
  - [x] Interface `CriarTemplateParams`
  - [x] Interface `ListarTemplatesParams`
  - [x] Interface `DocumentoUpload`
  - [x] Interface `UploadArquivoParams`
  - [x] Interface `DocumentoVersao`

### Serviços de Persistência (4-5h)
- [x] Criar `backend/documentos/services/persistence/documentos-persistence.service.ts`
  - [x] `criarDocumento(params, userId)`
  - [x] `listarDocumentos(params, userId)`
  - [x] `buscarDocumentoPorId(id)`
  - [x] `buscarDocumentoComUsuario(id)`
  - [x] `atualizarDocumento(id, params, userId)`
  - [x] `deletarDocumento(id)` (soft delete)
  - [x] `restaurarDocumento(id)`
  - [x] `deletarDocumentoPermanentemente(id)`
  - [x] `verificarAcessoDocumento(documentoId, usuarioId)`
- [x] Criar `backend/documentos/services/persistence/pastas-persistence.service.ts`
  - [x] `criarPasta(params, userId)`
  - [x] `listarPastasComContadores(pastaPaiId, userId)`
  - [x] `buscarPastaPorId(id)`
  - [x] `buscarHierarquiaPastas(pastaRaizId, incluirDocumentos, userId)`
  - [x] `atualizarPasta(id, params)`
  - [x] `deletarPasta(id)` (soft delete)
  - [x] `verificarAcessoPasta(pastaId, usuarioId)`
- [x] Criar `backend/documentos/services/persistence/compartilhamento-persistence.service.ts`
  - [x] `compartilharDocumento(params, userId)`
  - [x] `removerCompartilhamento(documentoId, usuarioId)`
  - [x] `listarCompartilhamentos(documentoId)`
  - [x] `atualizarPermissao(id, permissao)`
- [x] Criar `backend/documentos/services/persistence/templates-persistence.service.ts`
  - [x] `criarTemplate(params, userId)`
  - [x] `listarTemplates(params, userId)`
  - [x] `buscarTemplatePorId(id)`
  - [x] `atualizarTemplate(id, params)`
  - [x] `deletarTemplate(id)`
  - [x] `verificarPermissaoTemplate(templateId, usuarioId)`
- [x] Criar `backend/documentos/services/persistence/uploads-persistence.service.ts`
  - [x] `registrarUpload(params, userId)`
  - [x] `listarUploadsPorDocumento(documentoId)`
  - [x] `deletarUpload(id)`

### Serviços de Documentos (3-4h)
_Nota: Lógica de negócio implementada diretamente nas API routes (validações e chamadas de persistência)_
- [x] Validação de título (1-500 chars) - implementado em API routes
- [x] Validação de conteúdo (JSON válido) - implementado em API routes
- [x] Lógica de filtros (pasta, tags, busca textual) - implementado em persistence
- [x] Paginação - implementado em persistence
- [x] Verificação de permissões (criador ou compartilhado) - implementado via `verificarAcessoDocumento`
- [x] Auto-save - implementado em `/api/documentos/[id]/auto-save`

### API Routes Documentos (3-4h)
- [x] Criar `app/api/documentos/route.ts`
  - [x] `GET`: Listar documentos com autenticação
  - [x] `POST`: Criar documento com validação
- [x] Criar `app/api/documentos/[id]/route.ts`
  - [x] `GET`: Buscar documento por ID
  - [x] `PUT`: Atualizar documento completo
  - [x] `PATCH`: Atualizar documento parcial
  - [x] `DELETE`: Soft delete
- [x] Criar `app/api/documentos/[id]/auto-save/route.ts`
  - [x] `POST`: Auto-save com debounce no frontend
- [x] Adicionar tratamento de erros padronizado
- [x] Adicionar validação de inputs

### API Routes Pastas (2-3h)
- [x] Criar `app/api/pastas/route.ts`
  - [x] `GET`: Listar pastas (hierárquicas)
  - [x] `POST`: Criar pasta com validação de tipo
- [x] Criar `app/api/pastas/[id]/route.ts`
  - [x] `GET`: Buscar pasta por ID
  - [x] `PUT`: Atualizar pasta
  - [x] `DELETE`: Soft delete

### Upload Backblaze B2 (3-5h)
- [x] **Remover UploadThing**
  - [x] Deletar `app/_lib/uploadthing.ts`
  - [x] Deletar `app/api/uploadthing/route.ts`
  - [x] Deletar `app/_lib/hooks/use-upload-file.ts`
  - [ ] Remover dependência `uploadthing` do `package.json` (opcional, não bloqueia build)
- [x] Criar `backend/documentos/services/upload/b2-upload.service.ts`
  - [x] Validação de tipo MIME (whitelist)
  - [x] Validação de tamanho (max 50MB)
  - [x] Integração com `backend/storage/backblaze-b2.service.ts`
  - [x] Nomenclatura: `documentos/${documentoId}/${timestamp}_${random}.${ext}`
  - [x] Registro na tabela `documentos_uploads`
- [x] Criar `hooks/use-editor-upload.tsx`
  - [x] Upload via FormData
  - [x] Progress tracking (simulado)
  - [x] Error handling
  - [x] Callbacks onSuccess/onError
  - [x] DocumentEditorContext e Provider para compartilhar documentoId
- [x] Criar `app/api/documentos/[id]/upload/route.ts`
  - [x] `POST`: Receber FormData, validar, fazer upload
  - [x] `GET`: Listar uploads do documento

### Página de Listagem (4-5h)
- [x] Criar `app/(dashboard)/documentos/page.tsx`
  - [x] Integração com API `/api/documentos`
  - [ ] Grid/List view toggle
  - [ ] Filtros (pasta, tags, busca)
  - [ ] Paginação
  - [x] Botão "Criar Documento"
- [x] Criar `components/documentos/document-list.tsx`
  - [x] Cards de documentos com preview
  - [x] Ações inline (editar, compartilhar, deletar)
  - [x] Loading states
  - [x] Empty state
- [x] Criar `components/documentos/folder-tree.tsx`
- [x] Criar `components/documentos/document-card.tsx`
- [x] Criar `components/documentos/document-table.tsx`
- [x] Criar `components/documentos/create-document-dialog.tsx`
- [x] Criar `components/documentos/create-folder-dialog.tsx`

### Página de Editor + Auto-save (5-6h)
- [x] Criar `app/(dashboard)/documentos/[id]/page.tsx`
  - [x] Buscar documento da API
  - [x] Renderizar PlateEditor
  - [x] Toolbar via PlateEditor
  - [ ] Botão de exportação (pendente)
- [x] Criar `components/documentos/document-editor.tsx`
  - [x] Wrapper do PlateEditor com DocumentEditorProvider
  - [x] Auto-save com debounce de 2 segundos
  - [x] Indicador de status (salvando/salvo)
  - [x] Integração com API `/api/documentos/[id]/auto-save`
  - [x] Error handling
- [x] Criar `components/documentos/upload-dialog.tsx`
- [x] Criar `components/documentos/collaborators-avatars.tsx`

---

## 🟡 PRIORIDADE MÉDIA - Features Importantes (22-31 horas)

### Componentes de Pastas (4-5h)
- [ ] Criar `components/documentos/folder-tree.tsx`
  - [ ] Árvore hierárquica recursiva
  - [ ] Collapse/expand de pastas
  - [ ] Context menu (renomear, deletar)
  - [ ] Indicadores visuais (cor, ícone)
- [ ] Criar `components/documentos/folder-create-dialog.tsx`
  - [ ] Form para nome, tipo, pasta pai
  - [ ] Seletor de cor
  - [ ] Seletor de ícone (Lucide)
  - [ ] Validação

### Serviços de Pastas (2-3h)
- [ ] Criar `backend/documentos/services/pastas/criar-pasta.service.ts`
  - [ ] Validação de nome (1-200 chars)
  - [ ] Validação de tipo (comum/privada)
  - [ ] Validação de hierarquia (não permitir ciclos)
- [ ] Criar `backend/documentos/services/pastas/listar-pastas.service.ts`
  - [ ] Filtro por tipo
  - [ ] Filtro por pasta pai (navegação hierárquica)
- [ ] Criar `backend/documentos/services/pastas/mover-documento.service.ts`
  - [ ] Validação de permissões
  - [ ] Atualização de `pasta_id`
- [ ] Criar `backend/documentos/services/pastas/deletar-pasta.service.ts`
  - [ ] Soft delete de pasta
  - [ ] Opção de mover documentos para raiz ou deletar em cascata

### Componentes de Compartilhamento (3-4h)
- [ ] Criar `components/documentos/share-document-dialog.tsx`
  - [ ] Seletor de usuários (Combobox com busca)
  - [ ] Seletor de permissões (visualizar/editar)
  - [ ] Lista de compartilhamentos atuais
  - [ ] Botão remover compartilhamento
  - [ ] Indicadores visuais de status
- [ ] Integração com API `/api/documentos/[id]/compartilhar`

### Serviços de Compartilhamento (2-3h)
- [ ] Criar `backend/documentos/services/compartilhamento/compartilhar-documento.service.ts`
  - [ ] Validação: apenas criador pode compartilhar
  - [ ] Validação: usuário existe
  - [ ] Validação: não compartilhar com si mesmo
- [ ] Criar `backend/documentos/services/compartilhamento/remover-compartilhamento.service.ts`
  - [ ] Validação: apenas criador ou quem compartilhou pode remover
- [ ] Criar `backend/documentos/services/compartilhamento/listar-compartilhamentos.service.ts`
  - [ ] Join com tabela `usuarios` para nomes
- [ ] Criar `backend/documentos/services/compartilhamento/atualizar-permissao.service.ts`
  - [ ] Alterar permissão de visualizar/editar

### API Routes Compartilhamento (2h)
- [x] Criar `app/api/documentos/[id]/compartilhar/route.ts`
  - [x] `POST`: Compartilhar documento
  - [x] `DELETE`: Remover compartilhamento
  - [x] `PATCH`: Atualizar permissão

### Componentes de Templates (4-5h)
- [ ] Criar `components/documentos/template-library.tsx`
  - [ ] Grid de templates
  - [ ] Filtro por categoria
  - [ ] Filtro por visibilidade
  - [ ] Preview de template (thumbnail)
  - [ ] Botão "Usar Template"
- [ ] Criar `components/documentos/template-card.tsx`
  - [ ] Card visual do template
  - [ ] Informações (título, descrição, categoria)
  - [ ] Contador de uso
  - [ ] Ações (editar, deletar se for criador)

### Serviços de Templates (3-4h)
- [ ] Criar `backend/documentos/services/templates/criar-template.service.ts`
  - [ ] Validação de título (1-200 chars)
  - [ ] Validação de conteúdo (JSON Plate.js válido)
  - [ ] Validação de categoria
- [ ] Criar `backend/documentos/services/templates/listar-templates.service.ts`
  - [ ] Filtro por visibilidade (públicos + privados do usuário)
  - [ ] Filtro por categoria
  - [ ] Busca textual
- [ ] Criar `backend/documentos/services/templates/usar-template.service.ts`
  - [ ] Criar documento a partir de template
  - [ ] Incrementar `uso_count` do template
  - [ ] Copiar conteúdo do template
- [ ] Criar `backend/documentos/services/templates/deletar-template.service.ts`
  - [ ] Apenas criador pode deletar

### API Routes Templates (2-3h)
- [x] Criar `app/api/templates/route.ts`
  - [x] `GET`: Listar templates
  - [x] `POST`: Criar template
- [x] Criar `app/api/templates/[id]/route.ts`
  - [x] `GET`: Buscar template
  - [x] `PUT`: Atualizar template
  - [x] `DELETE`: Deletar template
- [ ] Criar `app/api/templates/[id]/usar/route.ts`
  - [ ] `POST`: Criar documento a partir do template

---

## 🟢 PRIORIDADE BAIXA - Nice to Have (23-31 horas)

### Command Menu (5-6h)
- [ ] Criar `components/documentos/command-menu.tsx`
  - [ ] Trigger com Cmd+K / Ctrl+K
  - [ ] Seção "Ações" (novo documento, nova pasta)
  - [ ] Seção "Documentos Recentes" (dinâmica)
  - [ ] Seção "Templates" (dinâmica)
  - [ ] Seção "Buscar Documentos" (com debounce)
  - [ ] Navegação por teclado
- [ ] Integração com todas as APIs relevantes

### Exportação DOCX (4-5h)
- [ ] Investigar plugin `@platejs/docx` (já instalado)
- [ ] Criar `backend/documentos/services/documentos/exportar-docx.service.ts`
  - [ ] Converter conteúdo Plate.js → DOCX
  - [ ] Usar biblioteca `@platejs/docx` ou alternativa
  - [ ] Retornar Buffer do arquivo
- [ ] Criar `app/api/documentos/[id]/exportar/docx/route.ts`
  - [ ] `GET`: Gerar e retornar arquivo DOCX
  - [ ] Headers apropriados para download
- [ ] Criar botão de exportação na UI

### Exportação PDF (6-8h)
- [ ] Decidir biblioteca (Puppeteer vs jsPDF vs pdfmake)
- [ ] Criar `backend/documentos/services/documentos/exportar-pdf.service.ts`
  - [ ] Converter conteúdo Plate.js → HTML
  - [ ] Renderizar HTML → PDF
  - [ ] Retornar Buffer do arquivo
- [ ] Criar `app/api/documentos/[id]/exportar/pdf/route.ts`
  - [ ] `GET`: Gerar e retornar arquivo PDF
  - [ ] Headers apropriados para download
- [ ] Criar botão de exportação na UI
- [ ] Testes com documentos complexos (tabelas, imagens, etc)

### Cache Redis (2-3h)
- [ ] Implementar cache para listagens de documentos
  - [ ] TTL: 5 minutos
  - [ ] Cache key: `documentos:list:user_${userId}:pasta_${pastaId}`
- [ ] Implementar cache para templates públicos
  - [ ] TTL: 15 minutos
  - [ ] Cache key: `templates:publicos`
- [ ] Invalidação de cache
  - [ ] On create documento/template
  - [ ] On update documento/template
  - [ ] On delete documento/template

### Testes (4-6h)
- [ ] Testes de integração das APIs
  - [ ] CRUD de documentos
  - [ ] CRUD de pastas
  - [ ] Compartilhamento
  - [ ] Templates
  - [ ] Upload
- [ ] Testes de RLS policies
  - [ ] Apenas criador pode deletar
  - [ ] Compartilhamento funciona corretamente
  - [ ] Pastas comuns vs privadas
- [ ] Testes de UI
  - [ ] Auto-save funciona
  - [ ] Upload funciona
  - [ ] Exportação funciona

### Documentação (2-3h)
- [ ] Documentação Swagger das APIs
  - [ ] JSDoc annotations nos endpoints
  - [ ] Schemas de request/response
- [ ] README do módulo
  - [ ] Como usar o editor
  - [ ] Como criar templates
  - [ ] Como compartilhar documentos
- [ ] Guia de uso para usuários finais

---

## ⭐ DECISÕES CONFIRMADAS - Features Adicionais (31-37 horas)

### Versionamento com Histórico (3-4h)
- [ ] Criar tabela `documentos_versoes` (já na migration)
- [ ] Criar `backend/documentos/services/versoes/criar-versao.service.ts`
  - [ ] Salvar versão anterior antes de atualizar documento
  - [ ] Armazenar versão, conteúdo, título, criado_por
- [ ] Criar `backend/documentos/services/versoes/listar-versoes.service.ts`
  - [ ] Listar todas as versões de um documento
  - [ ] Ordenar por versão (desc)
- [ ] Criar `backend/documentos/services/versoes/restaurar-versao.service.ts`
  - [ ] Restaurar versão anterior
  - [ ] Criar nova versão com conteúdo restaurado
- [ ] Criar `app/api/documentos/[id]/versoes/route.ts`
  - [ ] `GET`: Listar versões
  - [ ] `POST`: Restaurar versão
- [ ] Criar componente `components/documentos/version-history.tsx`
  - [ ] Lista de versões
  - [ ] Preview de cada versão
  - [ ] Botão "Restaurar"

### Soft Delete com Lixeira (2h)
- [x] Campo `deleted_at` já adicionado nas migrations
- [x] Atualizar serviços de delete para soft delete
  - [x] `deletarDocumento`: Apenas setar `deleted_at`
  - [x] `deletarPasta`: Apenas setar `deleted_at`
- [x] Criar `app/api/lixeira/route.ts`
  - [x] `GET`: Listar documentos deletados (where deleted_at IS NOT NULL)
- [x] Criar `app/api/lixeira/[id]/route.ts`
  - [x] `DELETE`: Deletar permanentemente
- [x] Criar `app/api/lixeira/[id]/restaurar/route.ts`
  - [x] `POST`: Setar `deleted_at = null`
- [ ] Criar componente `components/documentos/trash-view.tsx`
  - [ ] Lista de itens deletados
  - [ ] Botão "Restaurar"
  - [ ] Botão "Deletar Permanentemente"
- [ ] Criar job agendado para deletar permanentemente após 30 dias

### Permissões Customizadas (3h)
- [ ] Atualizar RLS policies para suportar permissões configuráveis
  - [ ] Policy update: Verificar `permissao = 'editar'` para updates
  - [ ] Policy delete: Apenas criador
- [ ] Criar campo `pode_deletar` em `documentos_compartilhados` (opcional)
- [ ] Atualizar componente de compartilhamento para incluir permissão de deleção (futuro)

### Colaboração em Tempo Real (15-20h)
- [ ] Integrar Supabase Realtime no editor
  - [ ] Criar canal Realtime para cada documento
  - [ ] Broadcast de alterações via Realtime
  - [ ] Receber alterações de outros usuários
- [ ] Adicionar `components/documentos/realtime-cursors.tsx`
  - [ ] Usar `RealtimeCursors` do Supabase
  - [ ] Mostrar cursores de outros usuários
  - [ ] Nome do usuário próximo ao cursor
- [ ] Adicionar `components/documentos/realtime-avatar-stack.tsx`
  - [ ] Usar `RealtimeAvatarStack` do Supabase
  - [ ] Mostrar avatares de usuários online no documento
- [ ] Implementar sincronização de conteúdo
  - [ ] Operational Transformation (OT) ou CRDT
  - [ ] Resolver conflitos automaticamente
  - [ ] Indicador de "outro usuário está editando"
- [ ] Testes de colaboração
  - [ ] Múltiplos usuários editando
  - [ ] Conflitos de edição
  - [ ] Reconexão após desconexão

### Chat Interno (8-10h)
- [x] Criar tabelas `salas_chat` e `mensagens_chat` (já na migration)
- [x] Criar `backend/documentos/services/persistence/chat-persistence.service.ts`
  - [x] Criação de salas
  - [x] Listagem de salas
  - [x] Criação de mensagens
  - [x] Listagem de mensagens
- [x] Criar `app/api/chat/salas/route.ts`
  - [x] `GET`: Listar salas
  - [x] `POST`: Criar sala
- [x] Criar `app/api/chat/salas/[id]/mensagens/route.ts`
  - [x] `GET`: Listar mensagens
  - [x] `POST`: Enviar mensagem
- [ ] Criar página `app/(dashboard)/chat/page.tsx`
  - [ ] Lista de salas
  - [ ] Seletor de sala ativa
  - [ ] Chat interface usando `RealtimeChat`
- [ ] Criar componente `components/chat/chat-interface.tsx`
  - [ ] Usar `RealtimeChat` do Supabase
  - [ ] Persistência de mensagens no banco
  - [ ] Notificações de novas mensagens
  - [ ] Indicador de "usuário está digitando"
- [ ] Integrar chat no editor de documentos
  - [ ] Botão para abrir chat lateral
  - [ ] Sala específica do documento
  - [ ] Notificações de mensagens

---

## 📋 Resumo de Progresso

**Total de Tasks**: ~94 tasks
- 🔴 Alta Prioridade: 40 tasks
- 🟡 Média Prioridade: 26 tasks
- 🟢 Baixa Prioridade: 28 tasks
- ⭐ Features Adicionais: ~30 tasks

**Estimativa Total**: 101-136 horas
