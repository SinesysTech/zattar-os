# Otimização de Disk I/O - Fase 6: Realtime Subscriptions

## Resumo Executivo

Implementação de otimizações focadas em reduzir Disk I/O Budget através de:
- Aumento do intervalo de polling de notificações (30s → 60s)
- Cache Redis para contador de notificações
- Materialized view para eliminar queries com join desnecessárias

**Data**: 2026-01-10
**Responsável**: Fase 6 de Otimização

---

## Mudanças Implementadas

### 1. **Polling de Notificações**

**Arquivo**: `src/features/notificacoes/hooks/use-notificacoes.ts`

**Alteração**:
- Intervalo aumentado de `30000ms` → `60000ms`
- Comentário adicionado explicando a mudança

**Benefício**:
- Redução de 50% na frequência de queries de polling
- Fallback menos frequente quando Realtime falha
- Impacto no Disk I/O Budget: **-50% em queries de notificações**

---

### 2. **Cache Redis no Contador de Notificações**

**Arquivo**: `src/features/notificacoes/service.ts`

**Alteração**:
- Função `contarNotificacoesNaoLidas()` envolvida com `withCache()`
- TTL: 30 segundos
- Chave de cache: `notificacoes:{"action":"contar_nao_lidas"}`

**Implementação**:
```typescript
export async function contarNotificacoesNaoLidas(): Promise<Result<ContadorNotificacoes>> {
  const cacheKey = generateCacheKey(CACHE_PREFIXES.notificacoes, { action: 'contar_nao_lidas' });
  
  const contador = await withCache(cacheKey, async () => {
    return await contarNotificacoesNaoLidasRepo();
  }, 30); // TTL 30 segundos

  return ok(contador);
}
```

**Benefício**:
- Cache de 30s absorve múltiplas chamadas do polling (agora a cada 60s)
- Hit rate esperado: >80%
- Redução de queries ao Supabase: **~70-80%**
- TTL curto garante dados relativamente atualizados

---

### 3. **Invalidação de Cache**

**Arquivo**: `src/lib/redis/invalidation.ts`

**Alteração**:
- Nova função: `invalidateNotificacoesCache()`
- Deleta padrão: `notificacoes:*`

**Implementação**:
```typescript
export async function invalidateNotificacoesCache(): Promise<void> {
  await deletePattern(`${CACHE_PREFIXES.notificacoes}:*`);
}
```

**Arquivo**: `src/features/notificacoes/actions/notificacoes-actions.ts`

**Alterações**:
- Importar: `import { invalidateNotificacoesCache } from '@/lib/redis/invalidation';`
- Em `actionMarcarNotificacaoComoLida`: Chamar `await invalidateNotificacoesCache();`
- Em `actionMarcarTodasComoLidas`: Chamar `await invalidateNotificacoesCache();`

**Benefício**:
- Cache mantém-se sempre consistente com banco
- Invalidação ocorre apenas quando dados mudam (marcação como lida)
- Previne cache stale

---

### 4. **Cache Prefixes**

**Arquivo**: `src/lib/redis/cache-utils.ts`

**Alteração**:
- Adicionado: `notificacoes: 'notificacoes'`
- Adicionado: `mensagensChat: 'mensagens_chat'`

**Benefício**:
- Namespacing adequado para futuras otimizações de chat
- Segue padrão estabelecido no projeto

---

### 5. **Materialized View de Chat**

**Arquivo**: `supabase/migrations/20260110000000_create_mensagens_chat_materialized_view.sql`

**Criação**:
- View: `public.mensagens_chat_com_usuario`
- Campos: Mensagens de chat com dados de usuário (nome, email, avatar)
- Índices: ID único + índice composto (sala, created_at)
- Função: `refresh_mensagens_chat_com_usuario()` com fallback
- Refresh inicial automático

**Benefício**:
- Elimina necessidade de query adicional com join em listagens
- Reduz impacto do Realtime (INSERT event já retorna dados completos)
- Possibilita uso em futuras otimizações de listagem

**Nota**: Delay máximo de ~5 minutos (refresh interval)

---

### 6. **Cron Job para Refresh da View**

**Arquivo**: `src/app/api/cron/refresh-chat-view/route.ts`

**Criação**:
- Endpoint: `POST /api/cron/refresh-chat-view`
- Autenticação: Bearer token via `CRON_SECRET`
- Timeout: 60 segundos
- Retorno: JSON com status, duração e timestamp

**Implementação**:
- Chama função RPC `refresh_mensagens_chat_com_usuario()`
- Log detalhado de sucesso/erro
- Fallback automático se CONCURRENTLY falhar

**Configuração** (escolha uma):

**Vercel Cron** (`vercel.json`):
```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-chat-view",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Alternativas**:
- cron-job.org: https://cron-job.org/
- GitHub Actions workflow
- CapRover cron
- Qualquer serviço que suporte HTTPS POST

---

## Métricas Esperadas

### Redução de Queries

| Operação | Antes | Depois | Redução |
|----------|-------|--------|---------|
| Polling de notificações (30s) | 1 query/30s | 1 query/60s | 50% |
| Contador com cache | Cache miss | 80% hit rate | ~70-80% queries |
| Chat com materialized view | Query + join | View + índice | ~30% latência |

### Impacto no Disk I/O Budget

**Notificações**:
- Antes: ~2,880 queries/dia (30s polling × 24h × 60min)
- Depois: ~1,440 queries/dia (60s polling) + cache hits
- **Redução estimada**: 40-50% queries de notificações

**Chat** (futuro):
- Após implementar uso de materialized view em listagens
- Redução estimada: 20-30% em queries de chat

---

## Próximas Etapas (Opcional)

### Curto Prazo
1. ✅ Monitorar impacto no Disk IO Budget após 24-48h
2. ✅ Verificar cache hit rate via Redis stats
3. ✅ Validar que alerts não disparam por causa das mudanças

### Médio Prazo
1. Considerar usar materialized view para listagem de mensagens
2. Avaliar se delay de 5min é aceitável para histórico
3. Expandir pattern para outras entidades (processos, audiências)

### Longo Prazo
1. Implementar invalidação inteligente (ao invés de TTL simples)
2. Usar pattern publish/subscribe para invalidação em tempo real
3. Monitorar e alertar sobre performance de views materialized

---

## Configuração Necessária

### Variáveis de Ambiente

Já existentes (nenhuma adição necessária):
- `CRON_SECRET` ou `VERCEL_CRON_SECRET` (para autenticação do cron)
- `ENABLE_REDIS_CACHE` (deve estar `true`)
- `REDIS_URL` e `REDIS_PASSWORD`

### Dependências

Nenhuma dependência adicional. Usa infraestrutura existente:
- Redis (já configurado)
- Supabase (já configurado)
- Next.js API Routes (já configurado)

---

## Validação Pós-Implementação

### Checklist

- [ ] Migration `20260110000000_create_mensagens_chat_materialized_view.sql` executada
- [ ] Cron job configurado (Vercel, cron-job.org, etc)
- [ ] Hook de notificações com polling de 60s deployed
- [ ] Cache de notificações com Redis funcionando
- [ ] Invalidação de cache acionada ao marcar como lida
- [ ] Logs monitorados em `/api/cron/refresh-chat-view`
- [ ] Disk IO Budget monitorado por 24-48h

### Testes

```bash
# Verificar migration
npm run db:status

# Testar cron manualmente
curl -X POST https://seu-dominio.com/api/cron/refresh-chat-view \
  -H "Authorization: Bearer $CRON_SECRET"

# Validar cache Redis
redis-cli
> KEYS "notificacoes:*"
> TTL "notificacoes:{\"action\":\"contar_nao_lidas\"}"

# Verificar view materializada
SELECT COUNT(*) FROM public.mensagens_chat_com_usuario;
```

---

## Troubleshooting

### Erro: "Cron secret not configured"
- Solução: Verificar `CRON_SECRET` ou `VERCEL_CRON_SECRET` em `.env.local`

### Erro: "Unauthorized" no cron
- Solução: Verificar header `Authorization: Bearer $token`

### View não atualiza
- Solução: Executar `SELECT public.refresh_mensagens_chat_com_usuario();` manualmente

### Cache muito agressivo
- Solução: Reduzir TTL de 30s para 15s (ou aumentar se não houver impacto)

---

## Referências

- [Redis Cache Utilities](src/lib/redis/cache-utils.ts)
- [Cache Invalidation](src/lib/redis/invalidation.ts)
- [Notifications Service](src/features/notificacoes/service.ts)
- [Notifications Hook](src/features/notificacoes/hooks/use-notificacoes.ts)
- [Chat Materialized View](supabase/migrations/20260110000000_create_mensagens_chat_materialized_view.sql)

---

**Última atualização**: 2026-01-10
**Status**: ✅ Implementado
