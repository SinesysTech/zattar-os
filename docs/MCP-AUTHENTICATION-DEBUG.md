# Guia de Debug de Autenticação MCP

## Visão Geral

O servidor MCP (Model Context Protocol) do Sinesys suporta três métodos de autenticação:

1. **Service API Key** (`x-service-api-key`) - Para integrações de sistema e automações
2. **Bearer Token** (JWT do Supabase) - Para usuários autenticados
3. **Session Cookie** - Para front-end autenticado

## Configuração da Service API Key

### 1. Variável de Ambiente

Certifique-se de que a variável `SERVICE_API_KEY` está configurada no arquivo `.env.local`:

```env
SERVICE_API_KEY=9fe76b04d74f07e2090e410e1acaf7058eb06984b8d859f2e97a7a0d8f465d8f
```

### 2. Configuração no N8N

No N8N, configure o header de autenticação:

- **Header Name**: `x-service-api-key`
- **Header Value**: `9fe76b04d74f07e2090e410e1acaf7058eb06984b8d859f2e97a7a0d8f465d8f`

## Mensagens de Erro Detalhadas

### Service API Key Inválida

**Erro**:
```json
{
  "jsonrpc": "2.0",
  "id": null,
  "error": {
    "code": -32600,
    "message": "Service API Key inválida. Verifique o valor do header x-service-api-key.",
    "data": {
      "tool": "nome_da_ferramenta",
      "requiresAuth": true,
      "authSource": null
    }
  }
}
```

**Solução**:
1. Verifique se o valor no N8N está **exatamente igual** ao valor em `.env.local`
2. Não deve haver espaços extras no início ou fim
3. A comparação é case-sensitive

**Logs no Servidor**:
```
[API Auth] ✗ Service API Key inválida
[API Auth] Recebido: 9fe76b04d7...
[API Auth] Esperado: 9fe76b04d7...
```

### SERVICE_API_KEY Não Configurada

**Erro**:
```json
{
  "jsonrpc": "2.0",
  "id": null,
  "error": {
    "code": -32600,
    "message": "SERVICE_API_KEY não configurada no servidor."
  }
}
```

**Solução**:
1. Adicione `SERVICE_API_KEY` ao `.env.local`
2. Reinicie o servidor Next.js

### Bearer Token Inválido

**Erro**:
```json
{
  "jsonrpc": "2.0",
  "id": null,
  "error": {
    "code": -32600,
    "message": "Bearer token inválido ou expirado: JWT expired"
  }
}
```

**Solução**:
1. Renove o token JWT através do Supabase
2. Verifique se o token não expirou
3. Verifique se o formato é: `Authorization: Bearer <token>`

### Nenhuma Autenticação Fornecida

**Erro**:
```json
{
  "jsonrpc": "2.0",
  "id": null,
  "error": {
    "code": -32600,
    "message": "Nenhuma autenticação fornecida. Use x-service-api-key, Bearer token ou sessão válida."
  }
}
```

**Solução**:
1. Adicione um dos métodos de autenticação suportados
2. Verifique se o header está sendo enviado corretamente

## Verificando Autenticação Bem-Sucedida

### Logs de Sucesso

**Service API Key**:
```
[API Auth] ✓ Autenticação bem-sucedida via Service API Key
```

**Bearer Token**:
```
[API Auth] ✓ Autenticação bem-sucedida via Bearer token - Usuário ID: 123
```

**Session Cookie**:
```
[API Auth] ✓ Autenticação bem-sucedida via sessão - Usuário ID: 123
```

## Endpoints MCP

### 1. POST /api/mcp/stream (Recomendado para N8N)

Endpoint HTTP Streamable compatível com N8N.

**Exemplo de Requisição**:
```bash
curl -X POST https://seu-dominio.com/api/mcp/stream \
  -H "Content-Type: application/json" \
  -H "x-service-api-key: 9fe76b04d74f07e2090e410e1acaf7058eb06984b8d859f2e97a7a0d8f465d8f" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

### 2. POST /api/mcp (SSE)

Endpoint Server-Sent Events para conexões persistentes.

### 3. POST /api/mcp/messages

Endpoint para mensagens individuais ou batch.

## Testando a Autenticação

### 1. Testar com curl

```bash
# Testar Service API Key
curl -X POST http://localhost:3000/api/mcp/stream \
  -H "Content-Type: application/json" \
  -H "x-service-api-key: 9fe76b04d74f07e2090e410e1acaf7058eb06984b8d859f2e97a7a0d8f465d8f" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize"
  }'
```

### 2. Testar com API Key Inválida

```bash
curl -X POST http://localhost:3000/api/mcp/stream \
  -H "Content-Type: application/json" \
  -H "x-service-api-key: chave-invalida" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize"
  }'
```

Deve retornar:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32600,
    "message": "Service API Key inválida. Verifique o valor do header x-service-api-key."
  }
}
```

## Troubleshooting

### Problema: N8N retorna erro -32600

1. **Verifique os logs do servidor**:
   - Procure por linhas com `[API Auth]`
   - Identifique qual autenticação está falhando

2. **Verifique o header**:
   - No N8N, certifique-se de que `x-service-api-key` está configurado
   - Verifique se não há espaços extras

3. **Verifique a variável de ambiente**:
   ```bash
   grep SERVICE_API_KEY .env.local
   ```

4. **Reinicie o servidor**:
   ```bash
   npm run dev
   ```

### Problema: Ferramenta específica requer autenticação

**✅ IMPORTANTE**: Ferramentas com `requiresAuth: true` **funcionam** com Service API Key!

A partir da versão atual, a verificação de autenticação aceita:
- `userId` real (usuários autenticados via Bearer token ou Session)
- `source: 'service'` (autenticação via Service API Key)

```typescript
// ✅ Aceito para ferramentas com requiresAuth: true
const isAuthenticated = authResult.authenticated &&
  (userId || authResult.source === 'service');
```

**Isso significa**: N8N com Service API Key pode executar **todas** as ferramentas que requerem autenticação!

Para verificar quais ferramentas requerem autenticação:

```bash
curl -X POST http://localhost:3000/api/mcp/stream \
  -H "Content-Type: application/json" \
  -H "x-service-api-key: sua-chave-aqui" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

Procure pelo campo `requiresAuth` na lista de ferramentas.

## Informações Adicionais

### Rate Limits

O MCP tem diferentes limites de taxa baseado no tipo de autenticação:

- **Anonymous**: 10 requisições/minuto
- **Authenticated**: 100 requisições/minuto
- **Service**: 1000 requisições/minuto

### Quotas

Quotas são aplicadas por usuário/tier:

- **Anonymous**: 100 requisições/dia
- **Authenticated**: 1000 requisições/dia
- **Service**: Ilimitado

## Contato

Para problemas adicionais, verifique:
- Logs do servidor Next.js
- Logs do N8N
- Configuração de rede/firewall
