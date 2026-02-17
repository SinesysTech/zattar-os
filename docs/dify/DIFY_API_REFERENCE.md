# Dify API - Referência Completa

**Fonte**: [Documentação Oficial Dify](https://docs.dify.ai/)  
**Data**: 2026-02-16  
**Base URL**: `https://api.dify.ai/v1`

---

## 🔐 Autenticação

Todas as requisições requerem API Key no header:

```
Authorization: Bearer {API_KEY}
```

**⚠️ Segurança**: Nunca exponha a API Key no frontend. Sempre use no backend.

---

## 📚 Índice

1. [Chat Applications](#chat-applications)
2. [Workflow Applications](#workflow-applications)
3. [Completion Applications](#completion-applications)
4. [Knowledge Base (Datasets)](#knowledge-base-datasets)
5. [Files](#files)
6. [Application Info](#application-info)

---

## 1. Chat Applications

### Send Chat Message

**Endpoint**: `POST /chat-messages`

**Request Body**:
```json
{
  "query": "Hello, how are you?",
  "inputs": {},
  "response_mode": "streaming", // ou "blocking"
  "conversation_id": "uuid", // opcional, para continuar conversa
  "user": "user-123",
  "files": [] // opcional
}
```

**Response (blocking)**:
```json
{
  "event": "message",
  "message_id": "uuid",
  "conversation_id": "uuid",
  "mode": "chat",
  "answer": "I'm doing well, thank you!",
  "metadata": {
    "usage": {
      "prompt_tokens": 100,
      "completion_tokens": 50,
      "total_tokens": 150,
      "total_price": "0.001",
      "currency": "USD"
    },
    "retriever_resources": []
  },
  "created_at": 1705407629
}
```

**Response (streaming)**: Server-Sent Events (SSE)
```
data: {"event": "message", "answer": "Hello", ...}
data: {"event": "message_end", ...}
```

### Get Conversations

**Endpoint**: `GET /conversations`

**Query Parameters**:
- `user`: string (required)
- `limit`: number (default: 20)

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Conversation 1",
      "inputs": {},
      "status": "normal",
      "created_at": 1705407629
    }
  ],
  "has_more": false
}
```

### Get Messages

**Endpoint**: `GET /messages`

**Query Parameters**:
- `conversation_id`: string (required)
- `user`: string (required)
- `limit`: number (default: 20)

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "conversation_id": "uuid",
      "query": "Hello",
      "answer": "Hi there!",
      "created_at": 1705407629
    }
  ],
  "has_more": false
}
```

### Send Feedback

**Endpoint**: `POST /messages/{message_id}/feedbacks`

**Request Body**:
```json
{
  "rating": "like", // ou "dislike"
  "user": "user-123"
}
```

### Stop Chat Task

**Endpoint**: `POST /chat-messages/{task_id}/stop`

**Request Body**:
```json
{
  "user": "user-123"
}
```

---

## 2. Workflow Applications

### Execute Workflow

**Endpoint**: `POST /workflows/run`

**Request Body**:
```json
{
  "inputs": {
    "query": "Summarize this text: ...",
    "target_language": "French"
  },
  "response_mode": "streaming", // ou "blocking"
  "user": "user_workflow_123",
  "files": [] // opcional, array de InputFileObject
}
```

**InputFileObject**:
```json
{
  "type": "document", // ou "image", "audio", "video", "custom"
  "transfer_method": "local_file", // ou "remote_url"
  "upload_file_id": "uuid", // se local_file
  "url": "https://example.com/file.pdf" // se remote_url
}
```

**Response (blocking)**:
```json
{
  "workflow_run_id": "uuid",
  "task_id": "uuid",
  "data": {
    "id": "uuid",
    "workflow_id": "uuid",
    "status": "succeeded", // ou "running", "failed", "stopped"
    "outputs": {
      "result": "Translated text..."
    },
    "error": null,
    "elapsed_time": 1.5,
    "total_tokens": 150,
    "total_steps": 3,
    "created_at": 1705407629,
    "finished_at": 1705407631
  }
}
```

**Response (streaming)**: Server-Sent Events
```
data: {"event": "workflow_started", "workflow_run_id": "uuid", "task_id": "uuid"}
data: {"event": "node_started", "data": {"title": "LLM", ...}}
data: {"event": "node_finished", "data": {...}}
data: {"event": "workflow_finished", "data": {"outputs": {...}}}
```

### Get Workflow Run Detail

**Endpoint**: `GET /workflows/run/{workflow_run_id}`

**Response**:
```json
{
  "id": "uuid",
  "workflow_id": "uuid",
  "status": "succeeded",
  "inputs": "{\"query\": \"...\"}",
  "outputs": {
    "result": "..."
  },
  "error": null,
  "total_steps": 3,
  "total_tokens": 150,
  "created_at": 1705407629,
  "finished_at": 1705407631,
  "elapsed_time": 1.5
}
```

### Stop Workflow Task

**Endpoint**: `POST /workflows/tasks/{task_id}/stop`

**Request Body**:
```json
{
  "user": "user-123"
}
```

### Get Workflow Logs

**Endpoint**: `GET /workflows/logs`

**Query Parameters**:
- `keyword`: string (opcional)
- `status`: string (opcional) - "succeeded", "failed", "stopped", "running"
- `page`: number (default: 1)
- `limit`: number (default: 20)

**Response**:
```json
{
  "page": 1,
  "limit": 20,
  "total": 100,
  "has_more": true,
  "data": [
    {
      "id": "uuid",
      "workflow_run": {
        "id": "uuid",
        "version": "1.0",
        "status": "succeeded",
        "elapsed_time": 1.5,
        "total_tokens": 150,
        "total_steps": 3,
        "created_at": 1705407629,
        "finished_at": 1705407631
      },
      "created_at": 1705407629
    }
  ]
}
```

---

## 3. Completion Applications

### Create Completion Message

**Endpoint**: `POST /completion-messages`

**Request Body**:
```json
{
  "inputs": {
    "text": "Hello, how are you?"
  },
  "response_mode": "streaming", // ou "blocking"
  "user": "user-123"
}
```

**Response (blocking)**:
```json
{
  "event": "message",
  "message_id": "uuid",
  "mode": "completion",
  "answer": "I'm doing well, thank you!",
  "metadata": {
    "usage": {
      "prompt_tokens": 100,
      "completion_tokens": 50,
      "total_tokens": 150
    }
  },
  "created_at": 1705407629
}
```

---

## 4. Knowledge Base (Datasets)

### List Datasets

**Endpoint**: `GET /datasets`

**Query Parameters**:
- `keyword`: string (opcional)
- `tag_ids`: string[] (opcional)
- `page`: number (default: 1)
- `limit`: number (default: 20, max: 100)
- `include_all`: boolean (default: false)

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "My Knowledge Base",
      "description": "Description",
      "provider": "vendor",
      "permission": "only_me",
      "data_source_type": "upload_file",
      "indexing_technique": "high_quality",
      "app_count": 2,
      "document_count": 10,
      "word_count": 5000,
      "created_at": 1705407629,
      "updated_at": 1705407629
    }
  ],
  "has_more": false,
  "limit": 20,
  "total": 1,
  "page": 1
}
```

### Create Dataset

**Endpoint**: `POST /datasets`

**Request Body**:
```json
{
  "name": "My Knowledge Base",
  "description": "Description",
  "indexing_technique": "high_quality", // ou "economy"
  "permission": "only_me", // ou "all_team_members", "partial_members"
  "embedding_model": "text-embedding-ada-002",
  "embedding_model_provider": "openai"
}
```

**Response**: Dataset object

### Get Dataset Detail

**Endpoint**: `GET /datasets/{dataset_id}`

**Response**: Dataset object com detalhes adicionais

### Update Dataset

**Endpoint**: `PATCH /datasets/{dataset_id}`

**Request Body**: Mesmos campos do Create (todos opcionais)

### Delete Dataset

**Endpoint**: `DELETE /datasets/{dataset_id}`

**Response**: 204 No Content

### Retrieve Chunks (Test Retrieval)

**Endpoint**: `POST /datasets/{dataset_id}/retrieve`

**Request Body**:
```json
{
  "query": "What is AI?",
  "retrieval_model": {
    "search_method": "semantic_search", // ou "hybrid_search", "full_text_search", "keyword_search"
    "reranking_enable": true,
    "top_k": 5,
    "score_threshold_enabled": true,
    "score_threshold": 0.7
  }
}
```

**Response**:
```json
{
  "query": {
    "content": "What is AI?"
  },
  "records": [
    {
      "segment": {
        "id": "uuid",
        "content": "AI is...",
        "score": 0.95,
        "document": {
          "id": "uuid",
          "name": "AI Basics"
        }
      }
    }
  ]
}
```

### List Documents

**Endpoint**: `GET /datasets/{dataset_id}/documents`

**Query Parameters**:
- `keyword`: string (opcional)
- `page`: number (default: 1)
- `limit`: number (default: 20)

### Create Document

**Endpoint**: `POST /datasets/{dataset_id}/document/create_by_text`

**Request Body**:
```json
{
  "name": "Document Name",
  "text": "Document content...",
  "indexing_technique": "high_quality",
  "process_rule": {
    "mode": "automatic" // ou "custom"
  }
}
```

### Delete Document

**Endpoint**: `DELETE /datasets/{dataset_id}/documents/{document_id}`

---

## 5. Files

### Upload File (Workflow)

**Endpoint**: `POST /files/upload`

**Content-Type**: `multipart/form-data`

**Form Data**:
- `file`: binary
- `user`: string

**Response**:
```json
{
  "id": "uuid",
  "name": "file.pdf",
  "size": 1024000,
  "extension": "pdf",
  "mime_type": "application/pdf",
  "created_by": "uuid",
  "created_at": 1705407629
}
```

**Limits**:
- Document: 15MB (default)
- Image: 10MB (default)
- Audio: 50MB (default)
- Video: 100MB (default)

---

## 6. Application Info

### Get App Info

**Endpoint**: `GET /info`

**Response**:
```json
{
  "name": "My App",
  "description": "This is my app",
  "tags": ["tag1", "tag2"]
}
```

### Get App Parameters

**Endpoint**: `GET /parameters`

**Response**:
```json
{
  "opening_statement": "Hello!",
  "suggested_questions_after_answer": {
    "enabled": true
  },
  "speech_to_text": {
    "enabled": true
  },
  "user_input_form": [
    {
      "paragraph": {
        "label": "Query",
        "variable": "query",
        "required": true,
        "default": ""
      }
    }
  ],
  "file_upload": {
    "image": {
      "enabled": true,
      "number_limits": 3,
      "transfer_methods": ["remote_url", "local_file"]
    }
  }
}
```

### Get WebApp Settings

**Endpoint**: `GET /site`

**Response**:
```json
{
  "title": "My App",
  "chat_color_theme": "#ff4a4a",
  "icon_type": "emoji",
  "icon": "😄",
  "description": "This is my app",
  "default_language": "en-US",
  "show_workflow_steps": false
}
```

---

## 🔄 Event Types (Streaming)

### Chat Events
- `message` - Chunk de resposta
- `message_end` - Fim da mensagem
- `error` - Erro

### Workflow Events
- `workflow_started` - Workflow iniciado
- `node_started` - Nó iniciado
- `node_finished` - Nó finalizado
- `workflow_finished` - Workflow finalizado
- `error` - Erro

---

## ⚠️ Error Codes

### Chat/Completion
- `invalid_param` - Parâmetro inválido
- `app_unavailable` - App indisponível
- `provider_not_initialize` - Provider não inicializado
- `provider_quota_exceeded` - Quota excedida
- `model_currently_not_support` - Modelo não suportado

### Workflow
- `workflow_request_error` - Erro na requisição do workflow

### Files
- `no_file_uploaded` - Nenhum arquivo enviado
- `file_too_large` - Arquivo muito grande
- `unsupported_file_type` - Tipo de arquivo não suportado

### Knowledge Base
- `dataset_name_duplicate` - Nome do dataset duplicado

---

## 📝 Notas de Implementação

### Response Modes

**blocking**: Resposta completa em uma única requisição
- Timeout: 100s (Cloudflare)
- Retorna JSON completo

**streaming**: Resposta em chunks via SSE
- Sem timeout
- Retorna `text/event-stream`
- Cada linha começa com `data: `

### User Identifier

O campo `user` é obrigatório em todas as requisições e serve para:
- Identificar o usuário final
- Rastrear uso
- Aplicar rate limits
- Isolar conversas

### Conversation Management

- Cada conversa tem um `conversation_id` único
- Para continuar uma conversa, envie o `conversation_id` nas próximas mensagens
- Conversas da API são isoladas das conversas do WebApp

---

## 🔗 Referências

- [Documentação Oficial](https://docs.dify.ai/)
- [API Reference](https://docs.dify.ai/api-reference)
- [GitHub](https://github.com/langgenius/dify)

---

**Última Atualização**: 2026-02-16
