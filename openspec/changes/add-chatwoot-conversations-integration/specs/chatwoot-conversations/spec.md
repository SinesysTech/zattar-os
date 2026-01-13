# chatwoot-conversations Specification

## Purpose
Integracao com endpoints de Conversations e Messages da API do Chatwoot, permitindo visualizar historico de comunicacao com clientes e partes diretamente no sistema.

## ADDED Requirements

### Requirement: Tipos TypeScript para Conversations
O sistema SHALL definir tipos TypeScript para representar conversas e mensagens do Chatwoot.

#### Scenario: Tipo Conversation
- **WHEN** uma conversa e recebida da API
- **THEN** SHALL conter id, uuid, status, labels, inbox_id, account_id
- **AND** SHALL conter meta com sender (contato) e assignee (agente)
- **AND** SHALL conter timestamps (created_at, updated_at, last_activity_at)

#### Scenario: Tipo Message
- **WHEN** uma mensagem e recebida da API
- **THEN** SHALL conter id, content, message_type, content_type, sender_type
- **AND** SHALL conter conversation_id referenciando a conversa
- **AND** SHALL suportar attachments e content_attributes

#### Scenario: Tipo ConversationStatus
- **WHEN** status de conversa e utilizado
- **THEN** SHALL ser um de: open, resolved, pending, snoozed, all

---

### Requirement: Obter Contagens de Conversas
O sistema SHALL permitir obter metricas de conversas por status.

#### Scenario: Contagens gerais
- **WHEN** usuario solicita metricas de conversas
- **THEN** o sistema SHALL retornar mine_count, unassigned_count, assigned_count, all_count
- **AND** SHALL suportar filtro por status, inbox_id, team_id, labels

#### Scenario: Filtro por termo de busca
- **WHEN** usuario fornece termo de busca (q)
- **THEN** o sistema SHALL retornar contagens apenas de conversas que contenham o termo

---

### Requirement: Listar Conversas do Chatwoot
O sistema SHALL permitir listar conversas com paginacao e filtros.

#### Scenario: Listagem basica
- **WHEN** usuario solicita lista de conversas
- **THEN** o sistema SHALL retornar lista paginada de conversas
- **AND** SHALL incluir ultima mensagem de cada conversa
- **AND** SHALL incluir metadados do contato (sender)

#### Scenario: Filtro por status
- **WHEN** usuario especifica status (open, resolved, pending, snoozed, all)
- **THEN** o sistema SHALL retornar apenas conversas com o status especificado

#### Scenario: Filtro por assignee
- **WHEN** usuario especifica assignee_type (me, unassigned, all, assigned)
- **THEN** o sistema SHALL retornar conversas conforme atribuicao

#### Scenario: Filtro por inbox e team
- **WHEN** usuario especifica inbox_id ou team_id
- **THEN** o sistema SHALL retornar apenas conversas do inbox/team especificado

#### Scenario: Filtro por labels
- **WHEN** usuario especifica array de labels
- **THEN** o sistema SHALL retornar conversas que possuem as labels

---

### Requirement: Buscar Conversa por ID
O sistema SHALL permitir buscar uma conversa especifica por ID.

#### Scenario: Busca por ID numerico
- **WHEN** usuario fornece ID da conversa
- **THEN** o sistema SHALL retornar conversa completa com mensagens recentes
- **AND** SHALL incluir metadados do contato e agente

---

### Requirement: Criar Nova Conversa
O sistema SHALL permitir criar uma nova conversa para um contato.

#### Scenario: Criacao com dados obrigatorios
- **WHEN** usuario fornece source_id e inbox_id
- **THEN** o sistema SHALL criar conversa no Chatwoot
- **AND** SHALL retornar ID da conversa criada

#### Scenario: Criacao com contact_id
- **WHEN** usuario fornece contact_id existente
- **THEN** o sistema SHALL vincular conversa ao contato especificado

#### Scenario: Criacao com mensagem inicial
- **WHEN** usuario fornece objeto message com content
- **THEN** o sistema SHALL criar conversa com a mensagem inicial

#### Scenario: Atribuicao de conversa
- **WHEN** usuario fornece assignee_id ou team_id
- **THEN** o sistema SHALL atribuir conversa ao agente/time especificado

---

### Requirement: Filtrar Conversas com Criterios Avancados
O sistema SHALL permitir filtrar conversas com multiplos criterios combinados.

#### Scenario: Filtro por atributo customizado
- **WHEN** usuario fornece payload com attribute_key e values
- **THEN** o sistema SHALL retornar conversas que atendem ao criterio

#### Scenario: Combinacao de filtros
- **WHEN** usuario fornece multiplos filtros com query_operator (AND/OR)
- **THEN** o sistema SHALL combinar filtros conforme operador logico

#### Scenario: Operadores de comparacao
- **WHEN** usuario especifica filter_operator
- **THEN** o sistema SHALL suportar: equal_to, not_equal_to, contains, does_not_contain

---

### Requirement: Listar Mensagens de Conversa
O sistema SHALL permitir listar todas as mensagens de uma conversa.

#### Scenario: Listagem completa
- **WHEN** usuario solicita mensagens de uma conversa
- **THEN** o sistema SHALL retornar todas as mensagens ordenadas por data
- **AND** SHALL incluir metadados do contato e agente

#### Scenario: Conteudo da mensagem
- **WHEN** mensagens sao retornadas
- **THEN** cada mensagem SHALL conter content, message_type, sender_type
- **AND** SHALL incluir attachments se existirem

#### Scenario: Tipos de mensagem
- **WHEN** mensagem e retornada
- **THEN** message_type SHALL indicar: 0 (incoming), 1 (outgoing), 2 (activity)
- **AND** sender_type SHALL indicar: contact ou user

---

### Requirement: Buscar Conversas de um Contato
O sistema SHALL permitir buscar todas as conversas de um contato especifico.

#### Scenario: Busca por contact_id
- **WHEN** usuario fornece ID do contato Chatwoot
- **THEN** o sistema SHALL retornar lista de conversas do contato
- **AND** SHALL ordenar por ultima atividade (mais recente primeiro)

#### Scenario: Busca por parte local
- **WHEN** usuario fornece tipo_entidade e entidade_id local
- **THEN** o sistema SHALL buscar chatwoot_contact_id no mapeamento
- **AND** SHALL retornar conversas do contato mapeado

---

### Requirement: MCP Tools para Conversations
O sistema SHALL expor operacoes de conversas como MCP tools para o AI assistant.

#### Scenario: Tool de listagem de conversas
- **WHEN** AI solicita `chatwoot_listar_conversas`
- **THEN** o sistema SHALL retornar lista resumida de conversas
- **AND** SHALL suportar filtros por status, inbox, labels

#### Scenario: Tool de conversas do contato
- **WHEN** AI solicita `chatwoot_buscar_conversas_contato` com contact_id
- **THEN** o sistema SHALL retornar conversas do contato
- **AND** SHALL incluir resumo de cada conversa (status, ultima mensagem)

#### Scenario: Tool de mensagens
- **WHEN** AI solicita `chatwoot_ver_mensagens` com conversation_id
- **THEN** o sistema SHALL retornar ultimas N mensagens da conversa
- **AND** SHALL formatar para contexto de conversa com AI

#### Scenario: Tool de metricas
- **WHEN** AI solicita `chatwoot_metricas_conversas`
- **THEN** o sistema SHALL retornar contagens por status
- **AND** SHALL permitir filtrar por inbox ou team

---

### Requirement: Formatacao de Telefone para Source ID
O sistema SHALL formatar telefones para uso como source_id ao criar conversas.

#### Scenario: Telefone brasileiro
- **WHEN** telefone brasileiro e fornecido
- **THEN** o sistema SHALL formatar como +55DDDNUMERO
- **AND** SHALL remover caracteres nao numericos

#### Scenario: Telefone sem codigo de pais
- **WHEN** telefone nao possui codigo de pais
- **THEN** o sistema SHALL assumir Brasil (+55)
