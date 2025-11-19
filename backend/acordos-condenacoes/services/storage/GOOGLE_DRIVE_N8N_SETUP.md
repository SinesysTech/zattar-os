# Configuração Google Drive via n8n

Este documento descreve como configurar o n8n para integrar o sistema de acordos/condenações com o Google Drive.

## Visão Geral

O sistema envia arquivos para um webhook do n8n, que processa e armazena os arquivos no Google Drive. Esta arquitetura permite:
- Desacoplamento entre o sistema e o Google Drive
- Processamento assíncrono de uploads
- Fácil customização de regras de armazenamento
- Centralização de credenciais do Google Drive no n8n

## Variáveis de Ambiente

Configure no arquivo `.env`:

```env
STORAGE_PROVIDER=google-drive
GOOGLE_DRIVE_WEBHOOK_URL=https://seu-n8n.com/webhook/google-drive
GOOGLE_DRIVE_WEBHOOK_TOKEN=  # Deixe em branco se não usar autenticação
```

## Endpoints Necessários no n8n

O webhook do n8n deve implementar 4 endpoints:

### 1. POST /upload - Upload de arquivo

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Headers (opcional): `Authorization: Bearer {token}`
- Body:
  ```
  file: <arquivo binário>
  path: "repasses/123/456/declaracao_1234567890_documento.pdf"
  contentType: "application/pdf"
  ```

**Response:**
```json
{
  "path": "repasses/123/456/declaracao_1234567890_documento.pdf",
  "url": "https://drive.google.com/file/d/xxxxx/view",
  "fileId": "xxxxx",
  "success": true
}
```

**Fluxo n8n sugerido:**
1. Webhook Trigger (POST)
2. Extract Binary Data do campo `file`
3. Google Drive - Upload File
   - File: `{{ $binary.file }}`
   - Parent Folder ID: Extrair da path ou usar pasta fixa
   - File Name: Extrair da path
4. Respond to Webhook
   - Status: 200
   - Body: JSON com path, url, fileId

---

### 2. POST /delete - Deletar arquivo

**Request:**
- Method: `POST`
- Content-Type: `application/json`
- Headers (opcional): `Authorization: Bearer {token}`
- Body:
  ```json
  {
    "path": "repasses/123/456/declaracao_1234567890_documento.pdf"
  }
  ```

**Response:**
```json
{
  "success": true
}
```

**Fluxo n8n sugerido:**
1. Webhook Trigger (POST)
2. Google Drive - Find File
   - Search: Nome do arquivo (extrair da path)
3. Google Drive - Delete File
   - File ID: `{{ $node["Find File"].json.id }}`
4. Respond to Webhook
   - Status: 200
   - Body: `{ "success": true }`

---

### 3. GET /get-url - Obter URL do arquivo

**Request:**
- Method: `GET`
- Headers (opcional): `Authorization: Bearer {token}`
- Query Params:
  - `path`: "repasses/123/456/declaracao_1234567890_documento.pdf"
  - `expiresIn`: 3600 (opcional, segundos)

**Response:**
```json
{
  "url": "https://drive.google.com/file/d/xxxxx/view",
  "expiresAt": "2025-01-20T12:00:00Z",
  "success": true
}
```

**Fluxo n8n sugerido:**
1. Webhook Trigger (GET)
2. Google Drive - Find File
   - Search: Nome do arquivo (extrair do query param path)
3. Set - Construir URL
   - url: `https://drive.google.com/file/d/{{ $node["Find File"].json.id }}/view`
   - expiresAt: Calcular baseado em expiresIn
4. Respond to Webhook
   - Status: 200
   - Body: JSON com url e expiresAt

---

### 4. GET /exists - Verificar existência do arquivo

**Request:**
- Method: `GET`
- Headers (opcional): `Authorization: Bearer {token}`
- Query Params:
  - `path`: "repasses/123/456/declaracao_1234567890_documento.pdf"

**Response:**
```json
{
  "exists": true
}
```

**Fluxo n8n sugerido:**
1. Webhook Trigger (GET)
2. Google Drive - Find File
   - Search: Nome do arquivo (extrair do query param path)
3. IF - Verificar se encontrou arquivo
   - True: Respond com `{ "exists": true }`
   - False: Respond com `{ "exists": false }`

---

## Estrutura de Pastas no Google Drive

Sugestão de organização:

```
Sinesys/
└── Repasses/
    └── {acordoId}/
        └── {parcelaId}/
            ├── declaracao_1234567890_documento.pdf
            └── comprovante_1234567891_recibo.pdf
```

## Segurança

### Autenticação (Opcional)

Se configurar `GOOGLE_DRIVE_WEBHOOK_TOKEN`, o sistema enviará o token no header:
```
Authorization: Bearer {seu-token-secreto}
```

Configure no n8n:
1. No nó Webhook, habilite "Authentication"
2. Type: "Header Auth"
3. Name: "Authorization"
4. Value: "Bearer {seu-token-secreto}"

### HTTPS

**IMPORTANTE**: Use sempre HTTPS em produção para proteger os arquivos em trânsito.

---

## Exemplo de Workflow Completo no n8n

### Upload Workflow

```
[Webhook] → [Extract Binary] → [Google Drive Upload] → [Response]
```

**Webhook Node:**
- HTTP Method: POST
- Path: /upload
- Response Mode: Respond to Webhook

**Extract Binary Node:**
- Binary Property: file
- JSON Property Name: fileData

**Google Drive Upload Node:**
- Operation: Upload
- File: `{{ $binary.fileData }}`
- Name: `{{ $json.body.path.split('/').pop() }}`
- Parent Folder: (ID da pasta destino)

**Response Node:**
- Response Code: 200
- Response Body:
```json
{
  "path": "{{ $json.body.path }}",
  "url": "{{ $node['Google Drive Upload'].json.webViewLink }}",
  "fileId": "{{ $node['Google Drive Upload'].json.id }}"
}
```

---

## Testando a Integração

### 1. Configurar n8n
1. Crie os workflows conforme exemplos acima
2. Ative os workflows
3. Copie a URL do webhook

### 2. Configurar Sistema
```env
STORAGE_PROVIDER=google-drive
GOOGLE_DRIVE_WEBHOOK_URL=https://seu-n8n.com/webhook/google-drive
```

### 3. Testar Upload
```bash
# Criar acordo e parcela via API
# Depois testar upload de declaração na interface
```

### 4. Verificar no Google Drive
- Arquivo deve aparecer na pasta configurada
- URL deve ser válida e acessível

---

## Troubleshooting

### Erro: GOOGLE_DRIVE_WEBHOOK_URL não configurada
- Verifique se a variável está no arquivo `.env`
- Reinicie o servidor após alterar `.env`

### Upload falha com 404
- Verifique se o workflow está ativo no n8n
- Confirme que a URL do webhook está correta

### Upload falha com 401
- Verifique se o token está configurado corretamente
- Confirme que o n8n está validando o token corretamente

### Arquivo não aparece no Google Drive
- Verifique logs do n8n
- Confirme que o nó Google Drive tem permissões corretas
- Verifique se a pasta destino existe

---

## Referências

- [n8n Documentation](https://docs.n8n.io/)
- [Google Drive API](https://developers.google.com/drive/api/v3/about-sdk)
- [n8n Google Drive Integration](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googledrive/)
