# Rate Limiting

Sistema de controle de taxa de requisições para proteger a API contra abuso e ataques de negação de serviço.

## Visão Geral

O sistema de rate limiting implementa:

- **Sliding Window Algorithm**: Mais preciso que fixed window, evita bursts no início de cada janela
- **Fail-Closed Strategy**: Bloqueia requisições quando Redis está indisponível (configurável)
- **Limites por Tier**: Diferentes limites para anonymous, authenticated e service
- **Limites por Endpoint**: Configuração específica para endpoints críticos
- **Limites Duplos**: Janela de minuto + janela de hora para tier anonymous

## Configuração

### Variáveis de Ambiente

```bash
# Modo de falha quando Redis está indisponível
# - 'closed': Bloqueia requisições (mais seguro, padrão)
# - 'open': Permite requisições (mais disponível)
RATE_LIMIT_FAIL_MODE=closed
```

### Limites por Tier

| Tier          | Limite/Min | Limite/Hora |
|---------------|------------|-------------|
| anonymous     | 5          | 100         |
| authenticated | 100        | -           |
| service       | 1000       | -           |

### Limites por Endpoint

| Endpoint         | Limite/Min |
|------------------|------------|
| /api/mcp         | 50         |
| /api/plate/ai    | 30         |
| /api/mcp/stream  | 20         |
| /api/auth        | 10         |

## Sliding Window Algorithm

O algoritmo de sliding window usa Redis Sorted Sets para rastrear requisições:

1. **ZREMRANGEBYSCORE**: Remove entradas antigas (fora da janela)
2. **ZADD**: Adiciona nova requisição com timestamp como score
3. **ZCARD**: Conta requisições na janela atual
4. **PEXPIRE**: Define TTL para limpeza automática

Vantagens sobre fixed window:
- Não permite bursts no início de cada janela
- Distribuição mais uniforme de requisições
- Cálculo preciso do limite em qualquer momento

## Uso

### Verificação Básica

```typescript
import { checkRateLimit, type RateLimitTier } from '@/lib/mcp/rate-limit';

const tier: RateLimitTier = 'authenticated';
const identifier = userId?.toString() || getClientIp(request);

const result = await checkRateLimit(identifier, tier);

if (!result.allowed) {
  return new Response('Rate limit exceeded', { status: 429 });
}
```

### Verificação por Endpoint

```typescript
import { checkEndpointRateLimit } from '@/lib/mcp/rate-limit';

const result = await checkEndpointRateLimit(
  identifier,
  '/api/plate/ai',
  tier
);
```

### Headers HTTP

```typescript
import { getRateLimitHeaders } from '@/lib/mcp/rate-limit';

const headers = getRateLimitHeaders(result);
// X-RateLimit-Limit: 100
// X-RateLimit-Remaining: 95
// X-RateLimit-Reset: 2024-01-15T10:30:00.000Z
// Retry-After: 60 (quando bloqueado)
```

## Fail-Closed vs Fail-Open

### Fail-Closed (Padrão)

Quando o Redis está indisponível, **bloqueia** todas as requisições:

- Mais seguro contra ataques durante falhas
- Pode causar indisponibilidade temporária
- Recomendado para produção

### Fail-Open

Quando o Redis está indisponível, **permite** todas as requisições:

- Prioriza disponibilidade sobre segurança
- Vulnerável durante falhas do Redis
- Útil para desenvolvimento/staging

## Integração com IP Blocking

Quando o rate limit é excedido, a atividade é registrada como suspeita:

```typescript
if (!result.allowed) {
  await recordSuspiciousActivity(clientIp, 'rate_limit_abuse', endpoint);
}
```

Após múltiplas violações (padrão: 10 em 1 hora), o IP é bloqueado automaticamente.

## Troubleshooting

### Redis Indisponível

**Sintoma**: Todas as requisições retornam 429 (fail-closed) ou rate limiting não funciona (fail-open)

**Solução**:
1. Verificar conexão Redis: `redis-cli ping`
2. Verificar variáveis de ambiente: `REDIS_URL`, `REDIS_PASSWORD`
3. Verificar logs: `[Rate Limit] Redis indisponível`

### Limits Muito Restritivos

**Sintoma**: Usuários legítimos sendo bloqueados

**Solução**:
1. Revisar limites por tier
2. Considerar aumentar limites para authenticated
3. Verificar se identificador está correto (userId vs IP)

### Sliding Window Keys Crescendo

**Sintoma**: Uso de memória Redis aumentando

**Solução**:
- As keys expiram automaticamente após windowMs
- ZREMRANGEBYSCORE remove entradas antigas a cada requisição
- PEXPIRE garante limpeza mesmo sem novas requisições

## Monitoramento

### Logs

```
[Rate Limit] Redis indisponível - bloqueando requisição (fail-closed mode)
[Plate AI] Rate limit excedido para 192.168.1.1 (tier: anonymous)
[MCP API] Rate limit excedido para user:123
```

### Métricas Recomendadas

- Taxa de requisições bloqueadas por tier
- Latência do Redis para operações de rate limit
- Número de IPs únicos por tier
