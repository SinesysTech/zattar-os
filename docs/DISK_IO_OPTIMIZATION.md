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

---

# Otimização de Disk I/O - Fase 7: VACUUM e Manutenção

## Resumo Executivo

Implementação de manutenção automatizada do banco de dados através de:
- Configuração de autovacuum agressivo em tabelas críticas
- Monitoramento automatizado de bloat via cron job
- Documentação para execução manual de VACUUM

**Data**: 2026-01-10
**Responsável**: Fase 7 de Otimização

---

## Mudanças Implementadas

### 1. **Configuração de Autovacuum Agressivo**

**Arquivo**: `supabase/migrations/20260110120000_configure_autovacuum_aggressive.sql`

**Tabelas configuradas**:
- `notificacoes`: `autovacuum_vacuum_scale_factor = 0.1` (vacuum a cada 10% dead tuples)
- `mensagens_chat`: `autovacuum_vacuum_scale_factor = 0.1`
- `embeddings_conhecimento`: `autovacuum_vacuum_scale_factor = 0.15`
- `embeddings`: `autovacuum_vacuum_scale_factor = 0.15`

**Benefício**:
- Autovacuum executa 2x mais frequentemente (default: 20% → novo: 10%)
- Reduz acúmulo de dead tuples
- Melhora cache hit rate
- Previne bloat excessivo

---

### 2. **Função RPC de Diagnóstico**

**Arquivo**: `supabase/migrations/20260110120001_create_vacuum_diagnostics_function.sql`

**Função**: `diagnosticar_bloat_tabelas()`

**Retorna**:
- Tamanho total da tabela
- Quantidade de dead tuples e live tuples
- Percentual de bloat
- Última execução de VACUUM (manual e automático)
- Flag `requer_vacuum` (true se bloat >20%)

**Uso**:
```sql
-- Via SQL Editor
select * from diagnosticar_bloat_tabelas();

-- Via Supabase Client
const { data } = await supabase.rpc('diagnosticar_bloat_tabelas');
```

---

### 3. **Cron Job de Monitoramento**

**Arquivo**: `src/app/api/cron/vacuum-maintenance/route.ts`

**Endpoint**: `POST /api/cron/vacuum-maintenance`

**Funcionalidade**:
- Executa `diagnosticar_bloat_tabelas()` semanalmente
- Loga resultados estruturados
- Envia alertas se bloat >50% (CRÍTICO)
- **NÃO executa VACUUM automaticamente** (segurança)

**Configuração** (escolha uma):

**Vercel Cron** (`vercel.json`):
```json
{
  "crons": [
    {
      "path": "/api/cron/vacuum-maintenance",
      "schedule": "0 3 * * 0"
    }
  ]
}
```
*Executa todo domingo às 3h da manhã*

**Alternativas**:
- cron-job.org: `0 3 * * 0` (domingo 3h)
- GitHub Actions: workflow semanal
- CapRover cron: `0 3 * * 0`

### 4. **VACUUM ANALYZE Agendado (GitHub Actions)**

**Arquivo**: `.github/workflows/vacuum-maintenance.yml`

**Funcionalidade**:
- Após executar o diagnóstico via endpoint, instala `psql` e roda `VACUUM ANALYZE` nas tabelas críticas (`acervo`, `audiencias`, `notificacoes`, `mensagens_chat`, `embeddings_conhecimento`, `embeddings`).
- Conexão via `SUPABASE_DB_URL` (string de conexão Postgres). SSL é exigido (`PGSSLMODE=require`).

**Secrets necessários**:
- `APP_URL`: URL pública da aplicação (ex.: `https://app.seu-dominio.com`)
- `CRON_SECRET`: Token usado no header `Authorization: Bearer ...` para o endpoint `/api/cron/vacuum-maintenance`
- `SUPABASE_DB_URL`: URL de conexão Postgres do projeto Supabase (ex.: `postgresql://user:pass@host:port/db?sslmode=require`)

**Agendamento**:
- `schedule: '0 3 * * 0'` (semanal, domingo 03:00 UTC)

**Observação**:
- `VACUUM` não pode ser executado dentro de funções PL/pgSQL (execução fora de transação). Por isso, a rotina de `VACUUM ANALYZE` é feita pelo workflow via `psql`.

---

## Execução Manual de VACUUM

### Quando Executar

**VACUUM ANALYZE** (sem lock):
- Bloat entre 20-50%
- Após grandes operações de DELETE/UPDATE
- Semanalmente em tabelas críticas

**VACUUM FULL** (com lock exclusivo):
- Bloat >50%
- Apenas em horário de baixo tráfego (madrugada)
- Avisar usuários antes

---

### Como Executar

#### 1. Verificar Bloat

Via Supabase Dashboard → SQL Editor:

```sql
-- Diagnóstico completo
select * from diagnosticar_bloat_tabelas();

-- Ou via Supabase CLI
npx supabase inspect db bloat --linked
```

#### 2. Executar VACUUM ANALYZE (Recomendado)

Via Supabase Dashboard → SQL Editor:

```sql
-- Tabelas prioritárias (baseado em diagnóstico)
vacuum analyze public.acervo;
vacuum analyze public.audiencias;
vacuum analyze public.notificacoes;
vacuum analyze public.mensagens_chat;
vacuum analyze public.embeddings_conhecimento;
vacuum analyze public.embeddings;

-- Verificar tamanho antes/depois
select 
  'acervo' as tabela,
  pg_size_pretty(pg_table_size('public.acervo')) as tamanho;
```

**Tempo estimado**: 30s - 2min por tabela (sem lock)

Alternativa automatizada (sem intervenção manual):
- Configurar `SUPABASE_DB_URL` e habilitar o workflow `.github/workflows/vacuum-maintenance.yml` para rodar semanalmente.
- O workflow executa `VACUUM ANALYZE` nas tabelas listadas acima.

#### 3. Executar VACUUM FULL (Apenas se Crítico)

⚠️ **ATENÇÃO**: VACUUM FULL causa lock exclusivo da tabela

Via Supabase Dashboard → SQL Editor:

```sql
-- APENAS em horário de baixo tráfego (madrugada)
-- Avisar usuários antes

-- Tabela de AI/RAG (menos crítica para usuários)
vacuum full public.embeddings_conhecimento;

-- Verificar tamanho antes/depois
select 
  'embeddings_conhecimento' as tabela,
  pg_size_pretty(pg_table_size('public.embeddings_conhecimento')) as tamanho;
```

**Tempo estimado**: 5-15min por tabela (com lock)

---

## Métricas Esperadas

### Redução de Bloat

| Tabela | Bloat Antes | Bloat Depois | Redução |
|--------|-------------|--------------|---------|
| notificacoes | ~30% | <10% | 66% |
| mensagens_chat | ~25% | <10% | 60% |
| embeddings_conhecimento | ~40% | <15% | 62% |

### Impacto no Disk I/O Budget

**Autovacuum agressivo**:
- Executa 2x mais frequentemente
- Reduz sequential scans em tabelas com bloat
- Melhora cache hit rate (menos páginas mortas)
- **Redução estimada**: 10-15% em Disk I/O Budget

**VACUUM manual**:
- Reclaima espaço em disco
- Melhora performance de queries
- Reduz necessidade de autovacuum emergencial

---

## Validação Pós-Implementação

### Checklist

- [ ] Migration `20260110120000_configure_autovacuum_aggressive.sql` executada
- [ ] Migration `20260110120001_create_vacuum_diagnostics_function.sql` executada
- [ ] Cron job configurado (Vercel, cron-job.org, etc)
- [ ] Função `diagnosticar_bloat_tabelas()` testada
- [ ] Logs monitorados em `/api/cron/vacuum-maintenance`
- [ ] VACUUM ANALYZE executado em tabelas com bloat >20%
- [ ] Disk IO Budget monitorado por 7 dias

### Testes

```bash
# Verificar migrations
npx supabase db status --linked

# Testar função RPC
npx supabase db execute --linked "select * from diagnosticar_bloat_tabelas();"

# Testar cron manualmente
curl -X POST https://seu-dominio.com/api/cron/vacuum-maintenance \
  -H "Authorization: Bearer $CRON_SECRET"

# Verificar configurações de autovacuum
npx supabase db execute --linked "
select relname, reloptions
from pg_class
where relname in ('notificacoes', 'mensagens_chat', 'embeddings_conhecimento', 'embeddings')
  and relkind = 'r';
"

# Verificar bloat via CLI
npx supabase inspect db bloat --linked

# Testar script local
npm run db:check-bloat
```

---

## Troubleshooting

### Erro: "Cron secret not configured"
- Solução: Verificar `CRON_SECRET` ou `VERCEL_CRON_SECRET` em `.env.local`

### Erro: "function diagnosticar_bloat_tabelas does not exist"
- Solução: Executar migration `20260110120001_create_vacuum_diagnostics_function.sql`

### Autovacuum não está executando
- Solução: Verificar configurações via `select * from pg_stat_user_tables where relname = 'notificacoes';`
- Verificar `last_autovacuum` timestamp

### VACUUM FULL travou a aplicação
- Solução: Executar apenas em horário de baixo tráfego (madrugada)
- Usar `VACUUM ANALYZE` (sem FULL) para manutenção regular

### Bloat continua alto após autovacuum
- Solução: Executar `VACUUM FULL` manualmente
- Considerar aumentar frequência de autovacuum (reduzir scale_factor para 0.05)

---

## Próximas Etapas (Opcional)

### Curto Prazo
1. ✅ Monitorar logs do cron job semanalmente
2. ✅ Executar VACUUM ANALYZE em tabelas com bloat >20%
3. ✅ Validar que autovacuum está executando (verificar `last_autovacuum`)

### Médio Prazo
1. Criar dashboard de métricas de bloat (Fase 8 - Monitoramento)
2. Implementar alertas automáticos via email/Slack
3. Considerar particionamento de tabelas grandes (acervo, mensagens_chat)

### Longo Prazo
1. Avaliar necessidade de upgrade de compute (se bloat persistir)
2. Implementar archiving de dados antigos (mensagens_chat >1 ano)
3. Considerar read replicas para queries pesadas

---

## Referências

- [Supabase Disk I/O Troubleshooting](https://supabase.com/docs/guides/platform/troubleshooting/high-disk-io)
- [PostgreSQL VACUUM Documentation](https://www.postgresql.org/docs/current/sql-vacuum.html)
- [PostgreSQL Autovacuum Tuning](https://www.postgresql.org/docs/current/routine-vacuuming.html#AUTOVACUUM)
- [Supabase CLI - Inspect DB Bloat](https://supabase.com/docs/reference/cli/supabase-inspect-db-bloat)

---

**Última atualização**: 2026-01-10
**Status**: ✅ Implementado
