# Tasks: Integrar Conversations e Messages do Chatwoot

## 1. Tipos TypeScript
- [x] 1.1 Adicionar tipos para Conversation (id, uuid, status, labels, messages, meta, etc.)
- [x] 1.2 Adicionar tipos para Message (id, content, message_type, sender, attachments, etc.)
- [x] 1.3 Adicionar tipos para ConversationMeta (counts: mine, unassigned, assigned, all)
- [x] 1.4 Adicionar tipos para request/response de cada endpoint
- [x] 1.5 Adicionar tipos para filtros de conversas (payload com attribute_key, filter_operator, values)

## 2. Modulo de Conversations
- [x] 2.1 Criar `src/lib/chatwoot/conversations.ts`
- [x] 2.2 Implementar `getConversationCounts()` - GET /conversations/meta
- [x] 2.3 Implementar `listConversations()` com paginacao e filtros
- [x] 2.4 Implementar `getConversation()` por ID
- [x] 2.5 Implementar `createConversation()` para iniciar conversa com contato
- [x] 2.6 Implementar `filterConversations()` com filtros avancados
- [x] 2.7 Implementar `getContactConversations()` - buscar conversas de um contato

## 3. Modulo de Messages
- [x] 3.1 Criar `src/lib/chatwoot/messages.ts`
- [x] 3.2 Implementar `getMessages()` - listar mensagens de uma conversa
- [x] 3.3 Implementar `getConversationHistory()` - helper para buscar historico completo

## 4. Tabela de Mapeamento (opcional para v1)
- [ ] 4.1 Criar migration para tabela `partes_chatwoot_conversas` (SKIPPED - v1 sem tabela, conforme design.md)
- [ ] 4.2 Definir estrutura: conversa_id, contato_id, processo_id (opcional), tipo_vinculo (SKIPPED)
- [ ] 4.3 Criar indices para consultas frequentes (SKIPPED)

## 5. Servicos de Integracao
- [x] 5.1 Adicionar funcoes ao `src/features/chatwoot/service.ts`
- [x] 5.2 Implementar `buscarConversasDaParte()` - buscar conversas de um cliente
- [x] 5.3 Implementar `buscarHistoricoConversa()` - buscar historico de uma conversa

## 6. MCP Tools
- [x] 6.1 Adicionar tool `chatwoot_listar_conversas` - listar conversas com filtros
- [x] 6.2 Adicionar tool `chatwoot_buscar_conversas_contato` - conversas de um contato
- [x] 6.3 Adicionar tool `chatwoot_ver_mensagens` - mensagens de uma conversa
- [x] 6.4 Adicionar tool `chatwoot_metricas_conversas` - contagens de conversas

## 7. Atualizacoes e Exports
- [x] 7.1 Atualizar `src/lib/chatwoot/index.ts` com novos exports
- [x] 7.2 Atualizar `src/features/chatwoot/index.ts`

## 8. Validacao
- [x] 8.1 TypeScript compila sem erros
- [ ] 8.2 Testar endpoints com script de desenvolvimento (manual)
