# 📋 API Chatwoot - Documentação Oficial (Context7)

**Última atualização:** 17/02/2026  
**Fonte:** `/chatwoot/docs` - Documentação oficial do Chatwoot (1075 code snippets, Score: 71.75)  
**Status:** ✅ Integração completa planejada

---

## 📑 Sumário Executivo

| Aspecto          | Detalhes                                                     |
| ---------------- | ------------------------------------------------------------ |
| **Base URL**     | `https://seu-chatwoot.com`                                   |
| **Tipos de API** | Public API (sem autenticação) + Agent API (com autenticação) |
| **Autenticação** | API Access Token (header: `api_access_token`)                |
| **Realtime**     | WebSocket/Pub-Sub via `pubsub_token`                         |
| **Rate Limit**   | A confirmar via integração                                   |
| **Webhooks**     | Suportados para eventos em tempo real                        |

---

## 🔐 Autenticação

### Public API (Sem Autenticação)

Endpoints que funcionam sem API key:

```javascript
// Criar contato público (chat widget)
POST / public / api / v1 / inboxes / { inboxId } / contacts;
POST /
  public /
  api /
  v1 /
  inboxes /
  { inboxId } /
  contacts /
  { contactId } /
  conversations;
POST /
  public /
  api /
  v1 /
  inboxes /
  { inboxId } /
  contacts /
  { contactId } /
  conversations /
  { convId } /
  messages;
```

### Agent API (Com Autenticação)

Endpoints que requerem `api_access_token`:

```bash
# Header obrigatório
-H "api_access_token: seu_api_key_aqui"
```

**Onde obter a chave:**

- Settings > Account Settings > API (no Chatwoot)
- Armazenar em `CHATWOOT_API_KEY` (env)

---

## 👥 Contatos API

### 1. Criar Contato (Public - Sem Auth)

**Endpoint:** `POST /public/api/v1/inboxes/{inboxId}/contacts`

```javascript
const createContact = async (inboxId, userData) => {
  const response = await fetch(
    `${CHATWOOT_API_URL}/public/api/v1/inboxes/${inboxId}/contacts`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: userData.identifier, // obrigatório: ID único do usuário
        name: userData.name, // opcional: nome
        email: userData.email, // opcional: email
        phone_number: userData.phone, // opcional: telefone
        avatar_url: userData.avatarUrl, // opcional: URL avatar
        custom_attributes: userData.customAttrs, // opcional: atributos customizados
      }),
    },
  );

  const data = await response.json();
  return {
    contactId: data.contact.id,
    pubsubToken: data.pubsub_token, // Para realtime
    contactData: data.contact,
  };
};
```

**Request Body:**

```json
{
  "identifier": "user_123",
  "identifier_hash": "hmac_hash_if_enabled",
  "name": "João Silva",
  "email": "joao@example.com",
  "phone_number": "+5511999999999",
  "avatar_url": "https://example.com/avatar.jpg",
  "custom_attributes": {
    "tipo_entidade": "cliente",
    "sistema_origem": "zattar",
    "entidade_id": 456
  }
}
```

**Response (200):**

```json
{
  "id": "contact_abc123",
  "pubsub_token": "ws_token_xyz",
  "source_id": "ext_contact_456",
  "contact": {
    "id": 789,
    "name": "João Silva",
    "email": "joao@example.com",
    "phone_number": "+5511999999999",
    "identifier": "user_123",
    "custom_attributes": {
      "tipo_entidade": "cliente",
      "entidade_id": 456
    }
  }
}
```

### 2. Obter Contato (Public)

**Endpoint:** `GET /public/api/v1/inboxes/{inboxId}/contacts/{contactId}`

```javascript
const getContact = async (inboxId, contactId) => {
  const response = await fetch(
    `${CHATWOOT_API_URL}/public/api/v1/inboxes/${inboxId}/contacts/${contactId}`,
    { method: "GET" },
  );
  return await response.json();
};
```

**Response:**

```json
{
  "id": 789,
  "name": "João Silva",
  "email": "joao@example.com",
  "phone_number": "+5511999999999",
  "identifier": "user_123",
  "custom_attributes": {}
}
```

### 3. Listar Contatos (Agent API - Com Auth)

**Endpoint:** `GET /api/v1/accounts/{accountId}/contacts`

```bash
curl -X GET "https://seu-chatwoot.com/api/v1/accounts/1/contacts?page=1&sort=created_at" \
  -H "api_access_token: sua_chave_aqui"
```

**Parâmetros:**

- `page` (int) - página da paginação
- `sort` - campo para ordenação
- `q` - termo de busca (nome, email, telefone)

---

## 💬 Conversas API

### 1. Criar Conversa (Agent API - Com Auth)

**Endpoint:** `POST /api/v1/accounts/{accountId}/conversations`

```bash
curl -X POST "https://seu-chatwoot.com/api/v1/accounts/1/conversations" \
  -H "api_access_token: sua_chave_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "source_id": "ext_conv_1234567890",
    "inbox_id": 1,
    "contact_id": 5,
    "status": "open",
    "assignee_id": 3,
    "team_id": 2,
    "custom_attributes": {
      "priority": "high",
      "order_id": "ORD-12345"
    },
    "message": {
      "content": "Consultoria sobre contrato"
    }
  }'
```

**Request Body:**

```json
{
  "source_id": "ext_conv_id", // obrigatório: ID externo único
  "inbox_id": 1, // obrigatório: qual inbox
  "contact_id": 5, // obrigatório: qual contato
  "status": "open", // opcional: open, resolved, on_hold
  "assignee_id": 3, // opcional: agente responsável
  "team_id": 2, // opcional: time responsável
  "custom_attributes": {}, // opcional: atributos custom
  "message": {
    "content": "Conteúdo inicial",
    "message_type": "incoming"
  }
}
```

**Response:**

```json
{
  "id": 123,
  "uuid": "conv-uuid-456",
  "source_id": "ext_conv_1234567890",
  "inbox_id": 1,
  "contact_id": 5,
  "status": "open",
  "assignee_id": 3,
  "team_id": 2,
  "custom_attributes": {},
  "created_at": "2023-06-01T10:00:00.000Z",
  "updated_at": "2023-06-01T10:00:00.000Z"
}
```

### 2. Listar Conversas (Agent API)

**Endpoint:** `GET /api/v1/accounts/{accountId}/conversations`

```bash
curl -X GET "https://seu-chatwoot.com/api/v1/accounts/1/conversations?status=open&assignee_type=me&page=1" \
  -H "api_access_token: sua_chave_aqui"
```

**Query Parameters:**

- `status` - `open`, `resolved`, `on_hold`, `all`
- `assignee_type` - `me`, `unassigned`
- `page` - número da página
- `sort` - campo para ordenação

**Response:**

```json
{
  "data": [
    {
      "id": 123,
      "status": "open",
      "contact_id": 5,
      "assignee_id": 3,
      "created_at": "2023-06-01T10:00:00.000Z"
    }
  ],
  "meta": {
    "count": 50,
    "current_page": 1,
    "all_count": 150,
    "mine_count": 45,
    "unassigned_count": 5,
    "assigned_count": 150
  }
}
```

### 3. Buscar Conversas de um Contato (Public)

**Endpoint:** `GET /public/api/v1/inboxes/{inboxId}/contacts/{contactId}/conversations`

```javascript
const getContactConversations = async (inboxId, contactId) => {
  const response = await fetch(
    `${CHATWOOT_API_URL}/public/api/v1/inboxes/${inboxId}/contacts/${contactId}/conversations`,
    { method: "GET" },
  );
  return await response.json();
};
```

### 4. Atualizar Status da Conversa

**Endpoint:** `PUT /api/v1/accounts/{accountId}/conversations/{convId}`

```bash
curl -X PUT "https://seu-chatwoot.com/api/v1/accounts/1/conversations/123" \
  -H "api_access_token: sua_chave_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "resolved",
    "assignee_id": 5
  }'
```

### 5. Atualizar Typing Status (Public)

**Endpoint:** `POST /public/api/v1/inboxes/{inboxId}/contacts/{contactId}/conversations/{convId}/toggle_typing`

```javascript
// Indicar que o usuário está digitando
await fetch(
  `${CHATWOOT_API_URL}/public/api/v1/inboxes/${inboxId}/contacts/${contactId}/conversations/${convId}/toggle_typing`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ typing_status: "on" }),
  },
);
```

---

## 📨 Mensagens API

### 1. Enviar Mensagem (Agent API - Com Auth)

**Endpoint:** `POST /api/v1/accounts/{accountId}/conversations/{convId}/messages`

```bash
curl -X POST "https://seu-chatwoot.com/api/v1/accounts/1/conversations/123/messages" \
  -H "api_access_token: sua_chave_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Obrigado por contatar! Como posso ajudar?",
    "message_type": "outgoing",
    "private": false,
    "content_type": "text"
  }'
```

**Request Body:**

```json
{
  "content": "Conteúdo da mensagem",
  "message_type": "outgoing", // outgoing, incoming, activity
  "private": false, // se for nota privada
  "content_type": "text" // text, attachment, template
}
```

**Response:**

```json
{
  "id": 456,
  "content": "Obrigado por contatar! Como posso ajudar?",
  "message_type": "outgoing",
  "content_type": "text",
  "private": false,
  "created_at": "2023-06-01T10:01:00.000Z",
  "sender": {
    "id": 3,
    "name": "Agent John",
    "type": "user"
  }
}
```

### 2. Enviar Mensagem (Public - Sem Auth)

**Endpoint:** `POST /public/api/v1/inboxes/{inboxId}/contacts/{contactId}/conversations/{convId}/messages`

```javascript
const sendMessage = async (inboxId, contactId, convId, content) => {
  const response = await fetch(
    `${CHATWOOT_API_URL}/public/api/v1/inboxes/${inboxId}/contacts/${contactId}/conversations/${convId}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: content,
        echo_id: `client_${Date.now()}_${Math.random()}`,
      }),
    },
  );
  return await response.json();
};
```

### 3. Listar Mensagens (Public)

**Endpoint:** `GET /public/api/v1/inboxes/{inboxId}/contacts/{contactId}/conversations/{convId}/messages`

```javascript
const getMessages = async (inboxId, contactId, convId) => {
  const response = await fetch(
    `${CHATWOOT_API_URL}/public/api/v1/inboxes/${inboxId}/contacts/${contactId}/conversations/${convId}/messages`,
    { method: "GET" },
  );
  return await response.json(); // Array de messages
};
```

**Response Example:**

```json
[
  {
    "id": "msg_789",
    "content": "Olá, tenho dúvida sobre preço",
    "message_type": "incoming",
    "content_type": "text",
    "created_at": "2023-06-01T10:01:00.000Z",
    "conversation_id": "456",
    "sender": {
      "id": 789,
      "name": "João Silva"
    }
  },
  {
    "id": "msg_790",
    "content": "Fico feliz em ajudar!",
    "message_type": "outgoing",
    "content_type": "text",
    "created_at": "2023-06-01T10:02:00.000Z",
    "conversation_id": "456",
    "sender": {
      "id": 3,
      "name": "Agent John"
    }
  }
]
```

### 4. Atualizar Last Seen (Public)

**Endpoint:** `POST /public/api/v1/inboxes/{inboxId}/contacts/{contactId}/conversations/{convId}/update_last_seen`

```javascript
await fetch(
  `${CHATWOOT_API_URL}/public/api/v1/inboxes/${inboxId}/contacts/${contactId}/conversations/${convId}/update_last_seen`,
  { method: "POST" },
);
```

---

## 🤖 Agent Bots API

### Criar Agent Bot (Platform API)

**Endpoint:** `POST /platform/api/v1/agent_bots`

```bash
curl -X POST "https://seu-chatwoot.com/platform/api/v1/agent_bots" \
  -H "api_access_token: seu_platform_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Support Bot",
    "description": "Assistente automático para dúvidas comuns",
    "outgoing_url": "https://seu-servidor.com/chatwoot/webhook"
  }'
```

**Request Body:**

```json
{
  "name": "Support Bot",
  "description": "Assistente automático",
  "outgoing_url": "https://seu-servidor.com/webhook" // obrigatório
}
```

**Response:**

```json
{
  "id": 89,
  "name": "Support Bot",
  "description": "Assistente automático",
  "outgoing_url": "https://seu-servidor.com/webhook",
  "access_token": "bot_token_abc123",
  "created_at": "2023-06-01T12:00:00.000Z"
}
```

---

## 🔔 Webhooks & Real-time Events

### Eventos Disponíveis

```
- message.created          // Nova mensagem
- conversation.created     // Nova conversa
- conversation.updated     // Conversa atualizada
- conversation.status_changed
- agent.joined             // Agente entrou em conversa
- agent.left
- contact.created
- contact.updated
- assignee.changed         // Agente Atualizado
```

### Configurar Webhook

No admin do Chatwoot:

1. Settings > Webhooks
2. Adicionar URL: `https://seu-app.com/api/webhooks/chatwoot`
3. Selecionar eventos
4. Salvar

### Payload de Exemplo

```json
{
  "event": "message.created",
  "data": {
    "message": {
      "id": 456,
      "content": "Olá",
      "message_type": "incoming",
      "created_at": "2023-06-01T10:01:00.000Z",
      "sender": {
        "id": 789,
        "name": "João Silva",
        "type": "contact"
      }
    },
    "conversation": {
      "id": 123,
      "uuid": "conv-uuid",
      "status": "open",
      "contact_id": 789
    }
  }
}
```

---

## 🎯 Pub/Sub Real-time (WebSocket)

### Conectar via Pub/Sub

```javascript
// Token obtido ao criar/buscar contato
const pubsubToken = "ws_token_xyz";

// WebSocket connection
const ws = new WebSocket(`wss://seu-chatwoot.com/cable?token=${pubsubToken}`);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "message.created") {
    console.log("Nova mensagem:", data.message);
  }
  if (data.type === "conversation.status_changed") {
    console.log("Status alterado:", data.status);
  }
};
```

---

## 🏛️ Inboxes API

### Listar Inboxes (Agent API)

**Endpoint:** `GET /api/v1/accounts/{accountId}/inboxes`

```bash
curl -X GET "https://seu-chatwoot.com/api/v1/accounts/1/inboxes" \
  -H "api_access_token: sua_chave_aqui"
```

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "name": "Support Chat",
      "channel_type": "web_widget",
      "avatar_url": null,
      "working_hours_enabled": false,
      "enable_auto_assignment": true,
      "enable_emails": true
    }
  ]
}
```

---

## 👨‍💼 Agents/Users API

### Listar Agentes (Agent API)

**Endpoint:** `GET /api/v1/accounts/{accountId}/agents`

```bash
curl -X GET "https://seu-chatwoot.com/api/v1/accounts/1/agents" \
  -H "api_access_token: sua_chave_aqui"
```

**Response:**

```json
{
  "data": [
    {
      "id": 3,
      "name": "Agent John",
      "email": "agent@example.com",
      "role": "agent",
      "active": true,
      "confirmed": true,
      "avatarUrl": "https://..."
    }
  ]
}
```

---

## 📏 Atributos Customizados

### Custom Attributes Suportados

Ao criar contato, você pode adicionar qualquer atributo customizado:

```javascript
const contact = await createContact(inboxId, {
  identifier: "user_123",
  name: "João Silva",
  custom_attributes: {
    // Atributos padrão Chatwoot
    tipo_pessoa: "pf", // pf, pj
    tipo_entidade: "cliente", // cliente, parte_contraria, terceiro

    // Seus atributos customizados
    sistema_origem: "zattar",
    entidade_id: 456,
    cpf: "123.456.789-00",
    cnpj: "12.345.678/0001-90",
    documento_numero: "123456789",
    ativo: true,
    data_primeira_contato: "2023-06-01",
    prioridade: "alta",
  },
});
```

---

## 🔗 Respostas Comuns

### Success (200, 201)

```json
{
  "success": true,
  "data": {
    /* resposta específica */
  }
}
```

### Validation Error (422)

```json
{
  "errors": {
    "field_name": ["erro 1", "erro 2"]
  }
}
```

### Not Found (404)

```json
{
  "error": "Resource not found"
}
```

### Unauthorized (401)

```json
{
  "error": "Unauthorized"
}
```

---

## 📊 Exemplo de Fluxo Completo

```javascript
/**
 * Fluxo completo: Usuário Zattar → Chatwoot
 * 1. Criar contato
 * 2. Criar conversa
 * 3. Enviar mensagem
 * 4. Manter sincronizado via webhooks
 */

const CHATWOOT_API = 'https://seu-chatwoot.com';
const INBOX_ID = 'abc123';

// 1. Criar contato no Chatwoot
const contactResponse = await fetch(
  `${CHATWOOT_API}/public/api/v1/inboxes/${INBOX_ID}/contacts`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'usuario_zattar_456', // unique ID do Zattar
      name: 'João Silva',
      email: 'joao@example.com',
      phone_number: '+5511999999999',
      custom_attributes: {
        entidade_id: 456,
        tipo_entidade: 'cliente',
        sistema_origem: 'zattar'
      }
    })
  }
);

const contactData = await contactResponse.json();
const chatwootContactId = contactData.contact.id;

// 2. Criar conversa
const conversationResponse = await fetch(
  `${CHATWOOT_API}/api/v1/accounts/1/conversations`,
  {
    method: 'POST',
    headers: {
      'api_access_token': 'sua_api_key',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      source_id: `zattar_conv_${Date.now()}`,
      inbox_id: INBOX_ID,
      contact_id: chatwootContactId,
      status: 'open',
      message: {
        content: 'Nova consulta jurídica'
      }
    })
  }
);

const conversationData = await conversationResponse.json();
const chatwootConversationId = conversationData.id;

// 3. Enviar primeira mensagem
const messageResponse = await fetch(
  `${CHATWOOT_API}/public/api/v1/inboxes/${INBOX_ID}/contacts/${contact Data.contact.identifier}/conversations/${chatwootConversationId}/messages`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: 'Olá! Gostaria de esclarecer dúvidas sobre meu caso.',
      echo_id: `client_${Date.now()}`
    })
  }
);

console.log('Conversa criada:', chatwootConversationId);
console.log('Contato vinculado ao Zattar:', chatwootContactId);
```

---

## ⚙️ Variáveis de Ambiente Necessárias

```env
# Chatwoot API
CHATWOOT_API_URL=https://seu-chatwoot.com
CHATWOOT_API_KEY=seu_api_access_token
CHATWOOT_ACCOUNT_ID=1
CHATWOOT_DEFAULT_INBOX_ID=abc123

# Platform API (bots)
CHATWOOT_PLATFORM_API_KEY=seu_platform_api_key
```

---

## 📚 Links Úteis

- **Documentação Oficial:** https://www.chatwoot.com/docs
- **API Reference:** https://developers.chatwoot.com
- **Community:** https://github.com/chatwoot/chatwoot

---

## 🎯 Próximas Etapas de Integração

1. ✅ Criar Client HTTP TypeScript (já implementado)
2. ✅ Documentar API completa (**este documento**)
3. ⏳ **Vincular usuários Zattar ↔ Chatwoot**
4. ⏳ **Sincronizar histórico de conversas**
5. ⏳ **Exibir conversas no perfil do cliente**
6. ⏳ **Notificações em tempo real (Pub/Sub)**
7. ⏳ **Atribuição automática de agentes**
8. ⏳ **Webhooks para sincronização bidirecional**

---

**Documentação mantida por:** Jordan Medeiros  
**Última sincronização com Context7:** 17/02/2026
