# IP Blocking

Sistema de bloqueio automático de IPs baseado em detecção de comportamento suspeito.

## Visão Geral

O sistema de IP blocking implementa:

- **Detecção Automática**: Monitora atividades suspeitas e bloqueia automaticamente
- **Whitelist**: IPs confiáveis que nunca são bloqueados
- **Bloqueio Temporário**: Bloqueios expiram automaticamente (padrão: 1 hora)
- **Bloqueio Permanente**: Para casos graves, requer remoção manual
- **Dashboard Admin**: Interface para gerenciamento de IPs

## Configuração

### Variáveis de Ambiente

```bash
# Habilita/desabilita o sistema de bloqueio
IP_BLOCKING_ENABLED=true

# IPs sempre permitidos (comma-separated)
IP_WHITELIST=127.0.0.1,::1

# Thresholds para bloqueio automático
IP_BLOCK_AUTH_FAILURES=5        # Falhas de auth em 5 min
IP_BLOCK_RATE_LIMIT_ABUSE=10    # Rate limits em 1 hora
IP_BLOCK_INVALID_ENDPOINTS=20   # Endpoints inválidos em 5 min
```

## Tipos de Atividades Suspeitas

### auth_failures

Falhas de autenticação (API key inválida, token expirado):

- **Threshold**: 5 falhas em 5 minutos
- **TTL Bloqueio**: 1 hora
- **Detectado em**: `api-auth.ts`

### rate_limit_abuse

Exceder rate limits repetidamente:

- **Threshold**: 10 vezes em 1 hora
- **TTL Bloqueio**: 1 hora
- **Detectado em**: Endpoints API

### invalid_endpoints

Requisições a endpoints inexistentes:

- **Threshold**: 20 requisições em 5 minutos
- **TTL Bloqueio**: 1 hora
- **Detectado em**: Middleware

### manual

Bloqueio manual via dashboard admin:

- **TTL Bloqueio**: Configurável (1 hora ou permanente)
- **Gerenciado via**: `/app/admin/security/blocked-ips`

## Arquitetura

### Middleware Integration

O middleware verifica IPs bloqueados antes de processar requisições:

```typescript
// middleware.ts
if (!isIpBlockingExcepted) {
  const clientIp = getClientIp(request);

  if (!(await isIpWhitelisted(clientIp))) {
    if (await isIpBlocked(clientIp)) {
      return new NextResponse("Access Denied", { status: 403 });
    }
  }
}
```

### Exceções

Alguns endpoints não são afetados pelo bloqueio:

- `/api/health` - Health checks
- `/api/csp-report` - Relatórios CSP

### Storage

Usa Redis com fallback para memória:

- **Bloqueio**: `security:blocked-ip:{ip}` (SET com TTL)
- **Motivo**: `security:block-reason:{ip}` (HASH)
- **Whitelist**: `security:whitelist` (SET)
- **Atividade**: `security:suspicious:{type}:{ip}` (SORTED SET)

## Uso Programático

### Verificar se IP está bloqueado

```typescript
import { isIpBlocked } from '@/lib/security/ip-blocking';

const blocked = await isIpBlocked('192.168.1.1');
```

### Registrar atividade suspeita

```typescript
import { recordSuspiciousActivity } from '@/lib/security/ip-blocking';

const result = await recordSuspiciousActivity(
  '192.168.1.1',
  'auth_failures',
  'Invalid API key'
);

if (result.blocked) {
  console.log('IP foi bloqueado automaticamente');
}
```

### Bloquear IP manualmente

```typescript
import { blockIp } from '@/lib/security/ip-blocking';

// Bloqueio temporário (1 hora)
await blockIp('192.168.1.1', {
  type: 'manual',
  count: 1,
  timestamp: Date.now(),
  details: 'Motivo do bloqueio',
});

// Bloqueio permanente
await blockIp('192.168.1.1', reason, 0);
```

### Desbloquear IP

```typescript
import { unblockIp } from '@/lib/security/ip-blocking';

await unblockIp('192.168.1.1');
```

### Gerenciar Whitelist

```typescript
import {
  addToWhitelist,
  removeFromWhitelist,
  isIpWhitelisted
} from '@/lib/security/ip-blocking';

await addToWhitelist('192.168.1.1');
await removeFromWhitelist('192.168.1.1');
const isWhitelisted = await isIpWhitelisted('192.168.1.1');
```

## Dashboard Admin

Acesse em: `/app/admin/security/blocked-ips`

### Funcionalidades

- **Visualizar IPs bloqueados**: Lista com motivo, contagem e expiração
- **Desbloquear IP**: Remove bloqueio temporário ou permanente
- **Adicionar à Whitelist**: Previne bloqueios futuros
- **Estatísticas**: Total bloqueados, permanentes, temporários

### Permissões

Requer papel `admin` ou `superadmin` na tabela `usuarios`.

## API Admin

### GET /api/admin/security/blocked-ips

Retorna lista de IPs bloqueados e whitelist:

```json
{
  "success": true,
  "data": {
    "blocked": [
      {
        "ip": "192.168.1.1",
        "reason": {
          "type": "auth_failures",
          "count": 5,
          "timestamp": 1705312800000,
          "details": "Invalid API key"
        },
        "blockedAt": "2024-01-15T10:00:00.000Z",
        "expiresAt": "2024-01-15T11:00:00.000Z",
        "permanent": false
      }
    ],
    "whitelist": ["127.0.0.1", "::1"],
    "stats": {
      "totalBlocked": 5,
      "permanent": 1,
      "temporary": 4,
      "whitelisted": 2
    }
  }
}
```

### POST /api/admin/security/blocked-ips

Gerencia IPs:

```json
// Desbloquear
{ "action": "unblock", "ip": "192.168.1.1" }

// Adicionar à whitelist
{ "action": "whitelist", "ip": "192.168.1.1" }

// Bloquear manualmente
{
  "action": "block",
  "ip": "192.168.1.1",
  "reason": "Descrição",
  "permanent": true
}

// Limpar atividade suspeita
{ "action": "clear_suspicious", "ip": "192.168.1.1" }
```

### DELETE /api/admin/security/blocked-ips?ip=192.168.1.1

Remove IP da whitelist.

## Graceful Degradation

Quando Redis está indisponível:

1. **In-Memory Fallback**: Usa cache em memória
2. **Whitelist ENV**: Sempre verifica `IP_WHITELIST` do ambiente
3. **Cleanup Automático**: Remove entradas expiradas periodicamente

## Troubleshooting

### IP Legítimo Bloqueado

1. Acessar dashboard: `/app/admin/security/blocked-ips`
2. Localizar IP na lista
3. Clicar "Desbloquear" ou "Adicionar à Whitelist"

### Detecção Não Funcionando

**Verificar**:
1. `IP_BLOCKING_ENABLED=true` no ambiente
2. Redis disponível e conectado
3. Logs: `[IP Blocking]` no console

### Muitos Falsos Positivos

**Ajustar thresholds**:
```bash
IP_BLOCK_AUTH_FAILURES=10    # Aumentar threshold
IP_BLOCK_RATE_LIMIT_ABUSE=20
```

### Bloqueio Não Expirando

**Verificar**:
1. TTL foi definido corretamente
2. Redis PEXPIRE funcionando
3. Se permanente, requer remoção manual

## Monitoramento

### Logs

```
[Security] Blocked IP attempt: 192.168.1.1
[IP Blocking] Auto-blocked IP 192.168.1.1 for auth_failures
[IP Blocking] IP unblocked by user 123: 192.168.1.1
```

### Alertas Recomendados

- Número de IPs bloqueados por hora
- Bloqueios permanentes (requer atenção manual)
- Tentativas de IPs bloqueados acessando sistema
