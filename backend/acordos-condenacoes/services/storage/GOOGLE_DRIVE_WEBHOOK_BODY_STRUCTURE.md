# Estrutura do Body para Webhook Google Drive (n8n)

## Visão Geral

**Método**: `POST` (para todas as operações)
**URL**: Única URL de webhook configurada no n8n
**Content-Type**: `application/json`
**Autenticação** (opcional): `Authorization: Bearer {token}`

A diferenciação das operações é feita através do campo `operation` no body JSON.

---

## 1. Upload de Arquivo

### Request Body

```json
{
  "operation": "upload",
  "path": "repasses/123/456/declaracao_1234567890_documento.pdf",
  "fileName": "declaracao_1234567890_documento.pdf",
  "fileContent": "JVBERi0xLjQKJeLjz9MKMyAwIG9iago8PC9UeXBlIC9QYWdlCi9QYXJlbnQgMSAwIFIKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KL0NvbnRlbnRzIDQgMCBSCi9SZXNvdXJjZXMgPDwvUHJvY1NldCBbL1BERiAvVGV4dCBdCi9Gb250IDw8L0YxIDYgMCBSID4+Pj4KPj4KZW5kb2JqCg...",
  "contentType": "application/pdf"
}
```

### Campos

- **operation**: `"upload"` (obrigatório)
- **path**: Caminho completo do arquivo no sistema (string, obrigatório)
- **fileName**: Nome do arquivo (string, obrigatório)
- **fileContent**: Conteúdo do arquivo em **base64** (string, obrigatório)
- **contentType**: MIME type do arquivo (string, obrigatório)
  - Exemplos: `"application/pdf"`, `"image/jpeg"`, `"image/png"`

### Response Body

```json
{
  "path": "repasses/123/456/declaracao_1234567890_documento.pdf",
  "url": "https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j/view",
  "fileId": "1a2b3c4d5e6f7g8h9i0j",
  "success": true
}
```

### Campos de Resposta

- **path**: Caminho do arquivo armazenado (string)
- **url**: URL de visualização do arquivo no Google Drive (string)
- **fileId**: ID único do arquivo no Google Drive (string)
- **success**: Indica sucesso da operação (boolean)

---

## 2. Deletar Arquivo

### Request Body

```json
{
  "operation": "delete",
  "path": "repasses/123/456/declaracao_1234567890_documento.pdf"
}
```

### Campos

- **operation**: `"delete"` (obrigatório)
- **path**: Caminho completo do arquivo a ser deletado (string, obrigatório)

### Response Body

```json
{
  "success": true
}
```

### Campos de Resposta

- **success**: Indica sucesso da operação (boolean)

---

## 3. Obter URL do Arquivo

### Request Body

```json
{
  "operation": "get-url",
  "path": "repasses/123/456/declaracao_1234567890_documento.pdf",
  "expiresIn": 3600
}
```

### Campos

- **operation**: `"get-url"` (obrigatório)
- **path**: Caminho completo do arquivo (string, obrigatório)
- **expiresIn**: Tempo de expiração em segundos (number, opcional)
  - Padrão: 3600 (1 hora)
  - Se não suportado pelo Google Drive, pode ser ignorado

### Response Body

```json
{
  "url": "https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j/view",
  "expiresAt": "2025-01-20T15:30:00Z",
  "success": true
}
```

### Campos de Resposta

- **url**: URL de acesso ao arquivo (string)
- **expiresAt**: Data/hora de expiração da URL (string ISO 8601, opcional)
- **success**: Indica sucesso da operação (boolean)

---

## 4. Verificar Existência do Arquivo

### Request Body

```json
{
  "operation": "exists",
  "path": "repasses/123/456/declaracao_1234567890_documento.pdf"
}
```

### Campos

- **operation**: `"exists"` (obrigatório)
- **path**: Caminho completo do arquivo (string, obrigatório)

### Response Body

```json
{
  "exists": true
}
```

### Campos de Resposta

- **exists**: Indica se o arquivo existe (boolean)

---

## Autenticação (Opcional)

Se `GOOGLE_DRIVE_WEBHOOK_TOKEN` estiver configurado, todas as requisições incluirão o header:

```
Authorization: Bearer seu-token-secreto-aqui
```

Configure no n8n:
1. No nó Webhook, vá em "Settings"
2. Ative "Authentication"
3. Type: "Header Auth"
4. Name: "Authorization"
5. Value: "Bearer seu-token-secreto-aqui"

---

## Exemplo Completo de Fluxo

### 1. Sistema Backend envia:

```http
POST https://seu-n8n.com/webhook/google-drive-storage
Content-Type: application/json
Authorization: Bearer seu-token-secreto

{
  "operation": "upload",
  "path": "repasses/123/456/declaracao_1234567890_documento.pdf",
  "fileName": "declaracao_1234567890_documento.pdf",
  "fileContent": "JVBERi0xLjQKJe...",
  "contentType": "application/pdf"
}
```

### 2. n8n processa e retorna:

```json
{
  "path": "repasses/123/456/declaracao_1234567890_documento.pdf",
  "url": "https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j/view",
  "fileId": "1a2b3c4d5e6f7g8h9i0j",
  "success": true
}
```

---

## Configuração no n8n

### Estrutura do Workflow

```
[Webhook POST]
    ↓
[Switch (operation)]
    ├─ upload → [Decode Base64] → [Google Drive Upload] → [Response]
    ├─ delete → [Find File] → [Delete] → [Response]
    ├─ get-url → [Find File] → [Get URL] → [Response]
    └─ exists → [Find File] → [Check Exists] → [Response]
```

### Nó Webhook

- **Method**: POST
- **Path**: `/google-drive-storage` (ou qualquer path que preferir)
- **Response Mode**: "Respond to Webhook"

### Nó Switch

- **Mode**: "Rules"
- **Rules**:
  - Rule 1: `{{ $json.body.operation }}` equals `upload`
  - Rule 2: `{{ $json.body.operation }}` equals `delete`
  - Rule 3: `{{ $json.body.operation }}` equals `get-url`
  - Rule 4: `{{ $json.body.operation }}` equals `exists`

---

## Tratamento de Erros

Se houver erro em qualquer operação, o n8n deve retornar:

```json
{
  "success": false,
  "error": "Descrição do erro"
}
```

Com status HTTP apropriado:
- 400: Bad Request (dados inválidos)
- 404: Not Found (arquivo não encontrado)
- 500: Internal Server Error (erro no processamento)
