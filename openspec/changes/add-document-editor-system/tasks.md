# Tasks: Sistema de Editor de Documentos

## 🔴 PRIORIDADE ALTA - MVP Funcional (28-36 horas)

### Navegação (1h)
- [ ] Reorganizar `components/layout/app-sidebar.tsx` em 3 seções
  - [ ] Criar array `navPrincipal` com itens atuais (Dashboard, Partes, Contratos, etc)
  - [ ] Criar array `navServicos` com "Editor de Documentos" e "Chat Interno"
  - [ ] Criar array `navAdministracao` com "Captura" (movido) e "Usuários"
  - [ ] Renderizar 3 seções na sidebar com títulos apropriados

### Banco de Dados - Migrations + RLS (2-3h)
- [ ] Criar migration `20251130000000_create_documentos_system.sql`
  - [ ] Tabela `documentos` com todos os campos, constraints e índices
  - [ ] Tabela `pastas` com self-referencing e trigger de validação de ciclos
  - [ ] Tabela `documentos_compartilhados` com constraint unique
  - [ ] Tabela `templates` com campos de visibilidade
  - [ ] Tabela `documentos_uploads` para rastreamento B2
  - [ ] Tabela `documentos_versoes` para histórico
  - [ ] Tabela `salas_chat` para salas de chat
  - [ ] Tabela `mensagens_chat` para mensagens
  - [ ] Função `validate_pasta_hierarchy()` para prevenir ciclos
  - [ ] Trigger `validate_pasta_hierarchy_trigger`
  - [ ] Função `update_updated_at_column()` para timestamps
- [ ] Criar RLS policies para todas as tabelas (4 policies por tabela: select, insert, update, delete)
- [ ] Testar migration em ambiente local
- [ ] Aplicar migration: `npx supabase db push`

### Tipos TypeScript (1h)
- [ ] Criar `backend/types/documentos/types.ts`
  - [ ] Interface `Documento`
  - [ ] Interface `CriarDocumentoParams`
  - [ ] Interface `AtualizarDocumentoParams`
  - [ ] Interface `ListarDocumentosParams`
  - [ ] Interface `ListarDocumentosResult`
  - [ ] Interface `Pasta`
  - [ ] Interface `CriarPastaParams`
  - [ ] Interface `ListarPastasParams`
  - [ ] Interface `DocumentoCompartilhado`
  - [ ] Interface `CompartilharDocumentoParams`
  - [ ] Interface `Template`
  - [ ] Interface `CriarTemplateParams`
  - [ ] Interface `ListarTemplatesParams`
  - [ ] Interface `DocumentoUpload`
  - [ ] Interface `UploadArquivoParams`
  - [ ] Interface `DocumentoVersao`

### Serviços de Persistência (4-5h)
- [ ] Criar `backend/documentos/services/persistence/documentos-persistence.service.ts`
  - [ ] `criarDocumento(params, userId)`
  - [ ] `listarDocumentos(params, userId)`
  - [ ] `buscarDocumentoPorId(id, userId)`
  - [ ] `atualizarDocumento(id, params, userId)`
  - [ ] `deletarDocumento(id, userId)` (soft delete)
- [ ] Criar `backend/documentos/services/persistence/pastas-persistence.service.ts`
  - [ ] `criarPasta(params, userId)`
  - [ ] `listarPastas(params, userId)`
  - [ ] `buscarPastaPorId(id, userId)`
  - [ ] `atualizarPasta(id, params, userId)`
  - [ ] `deletarPasta(id, userId)` (soft delete)
- [ ] Criar `backend/documentos/services/persistence/compartilhamento-persistence.service.ts`
  - [ ] `compartilharDocumento(params, userId)`
  - [ ] `removerCompartilhamento(documentoId, usuarioId, userId)`
  - [ ] `listarCompartilhamentos(documentoId, userId)`
  - [ ] `atualizarPermissao(id, permissao, userId)`
- [ ] Criar `backend/documentos/services/persistence/templates-persistence.service.ts`
  - [ ] `criarTemplate(params, userId)`
  - [ ] `listarTemplates(params, userId)`
  - [ ] `buscarTemplatePorId(id, userId)`
  - [ ] `atualizarTemplate(id, params, userId)`
  - [ ] `deletarTemplate(id, userId)`
- [ ] Criar `backend/documentos/services/persistence/uploads-persistence.service.ts`
  - [ ] `criarUpload(params, userId)`
  - [ ] `listarUploads(documentoId, userId)`
  - [ ] `deletarUpload(id, userId)`

### Serviços de Documentos (3-4h)
- [ ] Criar `backend/documentos/services/documentos/criar-documento.service.ts`
  - [ ] Validação de título (1-500 chars)
  - [ ] Validação de conteúdo (JSON válido)
  - [ ] Chamada de persistência
- [ ] Criar `backend/documentos/services/documentos/listar-documentos.service.ts`
  - [ ] Lógica de filtros (pasta, tags, busca textual)
  - [ ] Paginação (max 200 itens)
  - [ ] Ordenação customizável
- [ ] Criar `backend/documentos/services/documentos/buscar-documento.service.ts`
  - [ ] Verificação de permissões (criador ou compartilhado)
  - [ ] Retornar documento completo
- [ ] Criar `backend/documentos/services/documentos/atualizar-documento.service.ts`
  - [ ] Verificação de permissões (criador ou permissão "editar")
  - [ ] Incremento de versão
  - [ ] Atualização de timestamps
- [ ] Criar `backend/documentos/services/documentos/deletar-documento.service.ts`
  - [ ] Soft delete (campo `deleted_at`)
  - [ ] Apenas criador pode deletar
- [ ] Criar `backend/documentos/services/documentos/salvar-auto.service.ts`
  - [ ] Auto-save sem incremento de versão
  - [ ] Atualização apenas de conteúdo

### API Routes Documentos (3-4h)
- [ ] Criar `app/api/documentos/route.ts`
  - [ ] `GET`: Listar documentos com autenticação
  - [ ] `POST`: Criar documento com validação
- [ ] Criar `app/api/documentos/[id]/route.ts`
  - [ ] `GET`: Buscar documento por ID
  - [ ] `PUT`: Atualizar documento completo
  - [ ] `PATCH`: Atualizar documento parcial
  - [ ] `DELETE`: Soft delete
- [ ] Criar `app/api/documentos/[id]/auto-save/route.ts`
  - [ ] `POST`: Auto-save com debounce no frontend
- [ ] Adicionar tratamento de erros padronizado
- [ ] Adicionar validação de inputs

### API Routes Pastas (2-3h)
- [ ] Criar `app/api/pastas/route.ts`
  - [ ] `GET`: Listar pastas (hierárquicas)
  - [ ] `POST`: Criar pasta com validação de tipo
- [ ] Criar `app/api/pastas/[id]/route.ts`
  - [ ] `GET`: Buscar pasta por ID
  - [ ] `PUT`: Atualizar pasta
  - [ ] `DELETE`: Soft delete

### Upload Backblaze B2 (3-5h)
- [ ] **Remover UploadThing**
  - [ ] Deletar `app/_lib/uploadthing.ts`
  - [ ] Deletar `app/api/uploadthing/route.ts`
  - [ ] Remover dependência `uploadthing` do `package.json`
- [ ] Criar `backend/documentos/services/uploads/upload-arquivo.service.ts`
  - [ ] Validação de tipo MIME (whitelist)
  - [ ] Validação de tamanho (max 50MB)
  - [ ] Integração com `backend/storage/backblaze-b2.service.ts`
  - [ ] Nomenclatura: `editor/doc_${documentoId}/${timestamp}_${random}.${ext}`
  - [ ] Registro na tabela `documentos_uploads`
- [ ] Criar `hooks/use-editor-upload.ts`
  - [ ] Upload via FormData
  - [ ] Progress tracking (simulado)
  - [ ] Error handling
  - [ ] Callbacks onSuccess/onError
- [ ] Criar `app/api/documentos/[id]/uploads/route.ts`
  - [ ] `POST`: Receber FormData, validar, fazer upload
  - [ ] `DELETE`: Remover arquivo do B2 + banco

### Página de Listagem (4-5h)
- [ ] Criar `app/(dashboard)/documentos/page.tsx`
  - [ ] Integração com API `/api/documentos`
  - [ ] Grid/List view toggle
  - [ ] Filtros (pasta, tags, busca)
  - [ ] Paginação
  - [ ] Botão "Criar Documento"
- [ ] Criar `components/documentos/document-list.tsx`
  - [ ] Cards de documentos com preview
  - [ ] Ações inline (editar, compartilhar, deletar)
  - [ ] Loading states
  - [ ] Empty state

### Página de Editor + Auto-save (5-6h)
- [ ] Criar `app/(dashboard)/documentos/[id]/page.tsx`
  - [ ] Buscar documento da API
  - [ ] Renderizar PlateEditor
  - [ ] Toolbar customizada
  - [ ] Botão de exportação
- [ ] Criar `components/documentos/document-editor-wrapper.tsx`
  - [ ] Wrapper do PlateEditor
  - [ ] Auto-save com debounce de 2 segundos
  - [ ] Indicador de status (salvando/salvo)
  - [ ] Integração com API `/api/documentos/[id]/auto-save`
  - [ ] Error handling e retry

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
- [ ] Criar `app/api/documentos/[id]/compartilhar/route.ts`
  - [ ] `POST`: Compartilhar documento
  - [ ] `DELETE`: Remover compartilhamento
  - [ ] `PATCH`: Atualizar permissão

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
- [ ] Criar `app/api/templates/route.ts`
  - [ ] `GET`: Listar templates
  - [ ] `POST`: Criar template
- [ ] Criar `app/api/templates/[id]/route.ts`
  - [ ] `GET`: Buscar template
  - [ ] `PUT`: Atualizar template
  - [ ] `DELETE`: Deletar template
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
- [ ] Campo `deleted_at` já adicionado nas migrations
- [ ] Atualizar serviços de delete para soft delete
  - [ ] `deletarDocumento`: Apenas setar `deleted_at`
  - [ ] `deletarPasta`: Apenas setar `deleted_at`
- [ ] Criar `app/api/lixeira/documentos/route.ts`
  - [ ] `GET`: Listar documentos deletados (where deleted_at IS NOT NULL)
- [ ] Criar `app/api/lixeira/pastas/route.ts`
  - [ ] `GET`: Listar pastas deletadas
- [ ] Criar `app/api/lixeira/documentos/[id]/restaurar/route.ts`
  - [ ] `POST`: Setar `deleted_at = null`
- [ ] Criar `app/api/lixeira/pastas/[id]/restaurar/route.ts`
  - [ ] `POST`: Setar `deleted_at = null`
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
- [ ] Criar tabelas `salas_chat` e `mensagens_chat` (já na migration)
- [ ] Criar `backend/chat/services/salas/criar-sala.service.ts`
  - [ ] Validação de tipo (geral/documento/privado)
  - [ ] Associação com documento (se tipo = documento)
- [ ] Criar `backend/chat/services/salas/listar-salas.service.ts`
  - [ ] Filtro por tipo
  - [ ] Ordenar por última mensagem
- [ ] Criar `backend/chat/services/mensagens/enviar-mensagem.service.ts`
  - [ ] Validação de conteúdo
  - [ ] Broadcast via Realtime
- [ ] Criar `backend/chat/services/mensagens/listar-mensagens.service.ts`
  - [ ] Paginação
  - [ ] Ordenar por created_at
- [ ] Criar `app/api/chat/salas/route.ts`
  - [ ] `GET`: Listar salas
  - [ ] `POST`: Criar sala
- [ ] Criar `app/api/chat/salas/[id]/mensagens/route.ts`
  - [ ] `GET`: Listar mensagens
  - [ ] `POST`: Enviar mensagem
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
