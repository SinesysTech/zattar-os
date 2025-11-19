# Google Drive Storage via n8n - Guia Rápido

## 🎯 Configuração Simplificada

### 1. Variáveis de Ambiente

```env
STORAGE_PROVIDER=google-drive
GOOGLE_DRIVE_WEBHOOK_URL=https://seu-n8n.com/webhook/google-drive-storage
GOOGLE_DRIVE_WEBHOOK_TOKEN=
```

### 2. Webhook Único

**✅ TODAS as operações usam POST**
- URL: Uma única URL de webhook
- Método: POST
- Body: JSON com campo `operation`

---

## 📋 Estrutura do Body

### 1️⃣ UPLOAD

```json
{
  "operation": "upload",
  "path": "repasses/123/456/declaracao_1234567890_documento.pdf",
  "fileName": "declaracao_1234567890_documento.pdf",
  "fileContent": "JVBERi0xLjQK...",  // Base64
  "contentType": "application/pdf"
}
```

**Resposta:**
```json
{
  "path": "repasses/123/456/declaracao_1234567890_documento.pdf",
  "url": "https://drive.google.com/file/d/...",
  "fileId": "1a2b3c4d5e6f7g8h9i0j",
  "success": true
}
```

---

### 2️⃣ DELETE

```json
{
  "operation": "delete",
  "path": "repasses/123/456/declaracao_1234567890_documento.pdf"
}
```

**Resposta:**
```json
{
  "success": true
}
```

---

### 3️⃣ GET-URL

```json
{
  "operation": "get-url",
  "path": "repasses/123/456/declaracao_1234567890_documento.pdf",
  "expiresIn": 3600
}
```

**Resposta:**
```json
{
  "url": "https://drive.google.com/file/d/...",
  "expiresAt": "2025-01-20T15:30:00Z",
  "success": true
}
```

---

### 4️⃣ EXISTS

```json
{
  "operation": "exists",
  "path": "repasses/123/456/declaracao_1234567890_documento.pdf"
}
```

**Resposta:**
```json
{
  "exists": true
}
```

---

## 🔧 Fluxo no n8n

```
┌──────────────┐
│   Webhook    │ ← POST com body.operation
│   (POST)     │
└──────┬───────┘
       │
       v
┌──────────────────┐
│ Switch Operation │ ← Verifica body.operation
│  (if/else)       │
└──────┬───────────┘
       │
       ├─ "upload"    → [Decode Base64] → [Google Drive Upload] → [Response]
       ├─ "delete"    → [Find File]     → [Delete]              → [Response]
       ├─ "get-url"   → [Find File]     → [Get URL]             → [Response]
       └─ "exists"    → [Find File]     → [Check Exists]        → [Response]
```

---

## 📦 Arquivos Criados

1. **Backend Service**
   - `google-drive-storage.service.ts` - Implementação do storage

2. **Documentação**
   - `GOOGLE_DRIVE_WEBHOOK_BODY_STRUCTURE.md` - Estrutura completa dos bodies
   - `README_GOOGLE_DRIVE.md` - Este arquivo (guia rápido)

3. **Configuração**
   - `.env.google-drive.example` - Exemplo de variáveis de ambiente

4. **n8n Workflow**
   - `n8n-google-drive-workflow-single-webhook.json` - Workflow importável

---

## ⚡ Quick Start

### Passo 1: Configure o .env

```bash
cp .env.google-drive.example .env
```

Edite o `.env`:
```env
STORAGE_PROVIDER=google-drive
GOOGLE_DRIVE_WEBHOOK_URL=https://seu-n8n.com/webhook/google-drive-storage
GOOGLE_DRIVE_WEBHOOK_TOKEN=   # Deixe em branco por enquanto
```

### Passo 2: Importe o Workflow no n8n

1. Abra o n8n
2. Importe `n8n-google-drive-workflow-single-webhook.json`
3. Configure credenciais do Google Drive
4. **IMPORTANTE**: Substitua `SEU_FOLDER_ID_AQUI` pelo ID da pasta no Google Drive
5. Copie a URL do webhook
6. Ative o workflow

### Passo 3: Atualize a URL no .env

Cole a URL do webhook copiada:
```env
GOOGLE_DRIVE_WEBHOOK_URL=https://seu-n8n.com/webhook-test/google-drive-storage
```

### Passo 4: Teste!

Reinicie o servidor e teste fazendo upload de uma declaração ou comprovante na interface.

---

## 🔒 Autenticação (Opcional)

Para adicionar autenticação:

### 1. Gere um token seguro

```bash
openssl rand -hex 32
```

### 2. Configure no .env

```env
GOOGLE_DRIVE_WEBHOOK_TOKEN=seu-token-gerado-aqui
```

### 3. Configure no n8n

No nó Webhook:
- Settings → Authentication
- Type: "Header Auth"
- Name: `Authorization`
- Value: `Bearer seu-token-gerado-aqui`

---

## 📁 Estrutura de Pastas no Google Drive

Crie esta estrutura no Google Drive:

```
Sinesys/
└── Repasses/
    └── {acordoId}/
        └── {parcelaId}/
            ├── declaracao_1234567890_documento.pdf
            └── comprovante_1234567891_recibo.pdf
```

Obtenha o ID da pasta "Repasses" e use no workflow do n8n.

---

## 🐛 Troubleshooting

### Erro: "GOOGLE_DRIVE_WEBHOOK_URL não configurada"
- Verifique se a variável está no `.env`
- Reinicie o servidor após alterar `.env`

### Upload falha com 404
- Verifique se o workflow está ativo no n8n
- Confirme que a URL do webhook está correta

### Arquivo não aparece no Google Drive
- Verifique logs do n8n (veja execuções)
- Confirme que as credenciais do Google Drive estão corretas
- Verifique se a pasta destino existe e o ID está correto

### Erro ao decodificar base64
- Verifique se o nó "Decode Base64" está usando o código correto
- Teste com um arquivo pequeno primeiro (< 1MB)

---

## 📚 Documentação Completa

Para detalhes técnicos completos, consulte:
- `GOOGLE_DRIVE_WEBHOOK_BODY_STRUCTURE.md` - Especificação completa das APIs

---

## ✅ Checklist de Implementação

- [ ] Variáveis de ambiente configuradas
- [ ] Workflow importado no n8n
- [ ] Credenciais do Google Drive configuradas
- [ ] ID da pasta Google Drive atualizado no workflow
- [ ] Workflow ativado no n8n
- [ ] URL do webhook atualizada no .env
- [ ] Servidor reiniciado
- [ ] Teste de upload realizado com sucesso
- [ ] Arquivo apareceu no Google Drive
- [ ] (Opcional) Autenticação configurada

---

🎉 **Pronto! Seu sistema agora está integrado com o Google Drive via n8n!**
