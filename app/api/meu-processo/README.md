# API Meu Processo - Documentação

**Versão:** 2.0  
**Data:** 08/12/2025  
**Status:** Produção

---

## 📋 Visão Geral

API REST para consulta de dados de clientes pelo CPF para o aplicativo **Meu Processo**.

### Características

- ✅ Dados nativos da API Sinesys (sem transformações)
- ✅ Autenticação via Service API Key
- ✅ Cache HTTP (5 minutos)
- ✅ Métricas e logs estruturados
- ✅ Timeout configurável (30s)

---

## 🔌 Endpoints Disponíveis

### 1. POST `/api/meu-processo/consulta`

Consulta todos os dados de um cliente por CPF.

**Headers:**
```
Content-Type: application/json
x-service-api-key: <SERVICE_API_KEY>
```

**Request Body:**
```json
{
  "cpf": "12345678901"
}
```

**Response (200 OK):**
```json
{
  "processos": {
    "success": true,
    "data": {
      "cliente": { "nome": "...", "cpf": "..." },
      "processos": [...]
    }
  },
  "audiencias": {
    "success": true,
    "data": {
      "audiencias": [...]
    }
  },
  "contratos": {
    "success": true,
    "data": {
      "contratos": [...]
    }
  },
  "acordos": {
    "success": true,
    "data": {
      "acordos": [...]
    }
  }
}
```

**Respostas de Erro:**
- `400` - CPF inválido
- `401` - Autenticação inválida
- `404` - Cliente não encontrado
- `500` - Erro interno

---

### 2. GET `/api/meu-processo/cliente/{cpf}`

Endpoint agregado otimizado (queries paralelas no servidor).

**Headers:**
```
x-service-api-key: <SERVICE_API_KEY>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "cliente": {...},
    "processos": [...],
    "audiencias": [...],
    "contratos": [...],
    "acordos_condenacoes": [...]
  },
  "metadata": {
    "query_time_ms": 850,
    "cached": false
  }
}
```

---

### 3. GET `/api/meu-processo/health`

Health check do sistema.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-08T15:30:00.000Z",
  "checks": {
    "configuration": { "status": "pass" },
    "sinesys_api": { "status": "pass", "latency_ms": 120 }
  }
}
```

---

### 4. GET `/api/meu-processo/metrics`

Métricas de performance e confiabilidade.

**Response (200 OK):**
```json
{
  "period": {
    "start": "2025-12-08T00:00:00Z",
    "end": "2025-12-08T23:59:59Z"
  },
  "metrics": {
    "total_requests": 1542,
    "success_rate": 98.5,
    "error_rate": 1.5,
    "latency": {
      "p50": 850,
      "p95": 2100,
      "p99": 3500
    }
  }
}
```

---

## ⚙️ Configuração

### Variáveis de Ambiente

```env
# Autenticação (obrigatória)
SERVICE_API_KEY=sua_api_key_segura

# Supabase (obrigatória)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=sua_anon_key
SUPABASE_SECRET_KEY=sua_secret_key

# Timeout (opcional, padrão: 30000ms)
MEU_PROCESSO_TIMEOUT=30000

# Cache TTL (opcional, padrão: 300s)
MEU_PROCESSO_CACHE_TTL=300
```

---

## 🧪 Exemplos de Uso

### cURL

```bash
# Consulta por CPF
curl -X POST https://api.sinesys.com.br/api/meu-processo/consulta \
  -H "Content-Type: application/json" \
  -H "x-service-api-key: SUA_CHAVE_API" \
  -d '{"cpf":"12345678901"}'

# Health check
curl -X GET https://api.sinesys.com.br/api/meu-processo/health \
  -H "x-service-api-key: SUA_CHAVE_API"
```

### JavaScript/TypeScript

```typescript
const response = await fetch('/api/meu-processo/consulta', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-service-api-key': process.env.SERVICE_API_KEY,
  },
  body: JSON.stringify({ cpf: '12345678901' }),
});

const dados = await response.json();
```

---

## 📊 Estrutura de Dados

### Processos

Retorna a estrutura nativa da API `/api/acervo/cliente/cpf/{cpf}`:

```typescript
{
  success: boolean;
  data: {
    cliente: {
      nome: string;
      cpf: string;
    };
    processos: Array<{
      numero: string;
      tipo: string;
      tribunal: string;
      timeline: Array<{
        data: string;
        evento: string;
        descricao: string;
      }>;
      // ... outros campos
    }>;
  };
}
```

### Audiências

Retorna a estrutura nativa da API `/api/audiencias/cliente/cpf/{cpf}`.

### Contratos

Retorna a estrutura nativa da API `/api/contratos?clienteId={id}`.

### Acordos

Retorna a estrutura nativa da API `/api/acordos-condenacoes?processoId={id}`.

---

## 🚀 Performance

### Cache

- **Tipo:** HTTP Cache (Cache-Control)
- **TTL:** 5 minutos (configurável)
- **Escopo:** Private (por usuário)

### Timeout

- **Padrão:** 30 segundos
- **Configurável via:** `MEU_PROCESSO_TIMEOUT`

### Latência Esperada

- **P50:** < 1s
- **P95:** < 3s
- **P99:** < 5s

---

## 🔒 Segurança

### Autenticação

Todas as requisições exigem header `x-service-api-key`.

### Rate Limiting

Recomendado implementar no nível de infraestrutura (nginx, CloudFlare, etc.).

### Dados Sensíveis

- CPFs são mascarados nos logs (`***.***.***-01`)
- Dados trafegam via HTTPS
- API Key nunca exposta no client

---

## 📝 Logs

Todos os logs seguem formato estruturado JSON:

```json
{
  "timestamp": "2025-12-08T15:30:00.000Z",
  "level": "info",
  "source": "meu-processo",
  "cpf_masked": "***.***.***-01",
  "duration_ms": 850,
  "message": "Dados encontrados com sucesso"
}
```

---

## 🐛 Troubleshooting

### Erro 401 - Autenticação Inválida

- Verificar se `SERVICE_API_KEY` está configurada
- Confirmar header `x-service-api-key` na requisição

### Erro 400 - CPF Inválido

- CPF deve conter exatamente 11 dígitos
- Não pode ser sequência repetida (111.111.111-11)

### Erro 500 - Erro Interno

- Verificar logs do servidor
- Confirmar conectividade com Supabase
- Validar se todos os endpoints dependentes estão funcionando

---

**Preparado por:** Equipe Sinesys  
**Data:** 08/12/2025  
**Versão:** 2.0
