# Otimização de Disk I/O - Supabase

## 📊 Diagnóstico Inicial (Fase 1)

### Cache Hit Rate
- **Resultado**: [PREENCHER após executar queries]
- **Meta**: >99%
- **Status**: [OK / ATENÇÃO / CRÍTICO]

### Queries Lentas
[Colar resultado de pg_stat_statements]

### Sequential Scans
[Colar resultado de pg_stat_user_tables]

### Bloat
[Colar resultado de npx supabase inspect db bloat --linked]

### Índices Não Utilizados
[Colar resultado de npx supabase inspect db unused-indexes --linked]

---

## 🔧 Otimizações Aplicadas

### Fase 2: Otimização de Queries (SELECT *)
- ✅ Refatorado `processos/repository.ts`: `findProcessoById`, `findProcessoUnificadoById`
- ✅ Refatorado `audiencias/repository.ts`: `findById`, `findAll`
- ✅ Refatorado `acervo/repository.ts`: `listarAcervo`, `listarAcervoSemPaginacao`
- ✅ Criado helper `getProcessoColumns()` em `processos/domain.ts`

**Impacto esperado**: Redução de 30-50% no I/O de leitura

### Fase 3: Cache Redis
- ✅ Implementado cache em `processos/repository.ts` (TTL 300s/600s)
- ✅ Implementado cache em `audiencias/repository.ts` (TTL 300s/600s)
- ✅ Implementado cache em `usuarios/repository.ts` (TTL 600s)
- ✅ Invalidação automática em Server Actions

**Impacto esperado**: Redução de 60-80% em queries repetidas

### Fase 4: Otimização AI/RAG
- ✅ Batch inserts (50 chunks por vez) em `ai/indexing.ts`
- ✅ Rate limiting (100 processos, delay 5s) em `reindexarTudo()`
- ✅ Background job via Edge Function `indexar-documentos`
- ✅ Flag `ENABLE_AI_INDEXING` para emergências

**Impacto esperado**: Redução de 70% no I/O de embeddings

### Fase 5: Índices Adicionados
[Listar índices criados via migration]

**Impacto esperado**: Eliminação de sequential scans em tabelas críticas

### Fase 6: Otimização Realtime
- ✅ Polling de notificações: 30s → 60s
- ✅ Cache Redis em `actionContarNotificacoesNaoLidas` (TTL 30s)
- ✅ Removido query adicional em `use-chat-subscription.ts`

**Impacto esperado**: Redução de 50% em queries Realtime

### Fase 7: VACUUM e Manutenção
- ✅ Executado `VACUUM ANALYZE` em tabelas prioritárias
- ✅ Configurado autovacuum agressivo em `notificacoes` e `mensagens_chat`
- ✅ Cron job semanal via `/api/cron/vacuum-maintenance`

**Impacto esperado**: Recuperação de espaço, melhoria de 20-30% em queries

---

## 📈 Métricas Pós-Otimização

### Cache Hit Rate
- **Antes**: [PREENCHER]
- **Depois**: [PREENCHER]
- **Melhoria**: [PREENCHER]

### Disk IO Budget
- **Antes**: [PREENCHER]% consumido
- **Depois**: [PREENCHER]% consumido
- **Melhoria**: [PREENCHER]%

### Queries Lentas (>1s)
- **Antes**: [PREENCHER] queries
- **Depois**: [PREENCHER] queries
- **Melhoria**: [PREENCHER]%

---

## 🚨 Sistema de Monitoramento

### Dashboard
- **URL**: `/app/admin/metricas-db`
- **Acesso**: Apenas super_admins
- **Atualização**: Manual (botão "Atualizar") ou cache 60s

### Alertas Automáticos
- **Cron**: A cada 1 hora (`/api/cron/alertas-disk-io`)
- **Notificações**: Via `criar_notificacao` para super_admins
- **Thresholds**:
  - Cache hit rate < 95%
  - Bloat > 50% em qualquer tabela

### Logging
- **Queries lentas**: Log automático se >1s (quando `DEBUG_SUPABASE=true`)
- **Localização**: Console do servidor

---

## 📚 Runbook - Troubleshooting

### Disk IO Budget Esgotando
1. Acessar `/app/admin/metricas-db`
2. Verificar cache hit rate:
   - Se <95%: Executar `VACUUM ANALYZE` nas tabelas com bloat
   - Se >99%: Problema é volume de queries, considerar upgrade
3. Verificar queries lentas:
   - Otimizar queries >1s
   - Adicionar índices faltantes
4. Verificar bloat:
   - Se >50%: Executar `VACUUM FULL` em horário de baixo tráfego
5. Desabilitar AI indexing temporariamente: `ENABLE_AI_INDEXING=false`

### Cache Hit Rate Baixo (<95%)
1. Executar `VACUUM ANALYZE` em todas as tabelas
2. Verificar se autovacuum está funcionando:
   ```sql
   SELECT schemaname, relname, last_vacuum, last_autovacuum 
   FROM pg_stat_user_tables 
   ORDER BY last_autovacuum DESC NULLS LAST;
   ```
3. Considerar upgrade de compute para aumentar RAM (cache)

### Bloat Crítico (>50%)
1. Identificar tabelas via `/app/admin/metricas-db`
2. Agendar manutenção em horário de baixo tráfego (madrugada)
3. Executar via SQL Editor:
   ```sql
   VACUUM FULL public.tabela_com_bloat;
   ```
4. Monitorar tamanho antes/depois:
   ```sql
   SELECT pg_size_pretty(pg_table_size('public.tabela_com_bloat'));
   ```

### Queries Lentas Persistentes
1. Identificar via `/app/admin/metricas-db`
2. Analisar plano de execução:
   ```sql
   EXPLAIN ANALYZE [query];
   ```
3. Adicionar índices faltantes
4. Refatorar query para usar colunas específicas (não `SELECT *`)

---

## 🔄 Decisão de Upgrade de Compute

### Métricas Atuais
- **Cache hit rate**: [PREENCHER]
- **Disk IO Budget**: [PREENCHER]% consumido
- **Compute atual**: [Micro/Small/Medium/Large]

### Recomendação
- ✅ **Manter atual**: Cache hit rate >99%, Disk IO <80%
- ⚠️ **Upgrade para Small**: Cache hit rate 95-99%, Disk IO 80-90%
- 🚨 **Upgrade para Large**: Cache hit rate <95%, Disk IO >90%

### Custo-Benefício
| Compute | RAM | IOPS | Mbps | Custo/mês | Recomendado para |
|---------|-----|------|------|-----------|------------------|
| Micro   | 1GB | 500  | 87   | $0        | Desenvolvimento  |
| Small   | 2GB | 1000 | 174  | ~$15      | Produção leve    |
| Medium  | 4GB | 2000 | 347  | ~$60      | Produção média   |
| Large   | 8GB | 3600 | 630  | ~$110     | Produção pesada  |

**Nota**: Upgrade causa ~2min de downtime. Agendar para horário de baixo tráfego.

---

## 📝 Histórico de Mudanças

| Data | Fase | Descrição | Impacto |
|------|------|-----------|---------|
| [DATA] | Fase 1 | Diagnóstico inicial | - |
| [DATA] | Fase 2 | Otimização SELECT * | -30% I/O |
| [DATA] | Fase 3 | Cache Redis | -60% queries |
| [DATA] | Fase 4 | Otimização AI/RAG | -70% embeddings |
| [DATA] | Fase 5 | Índices adicionados | Eliminado seq scans |
| [DATA] | Fase 6 | Otimização Realtime | -50% polling |
| [DATA] | Fase 7 | VACUUM | +20% performance |
| [DATA] | Fase 8 | Monitoramento | Alertas ativos |

---

**Última atualização**: [DATA]
**Responsável**: [NOME]
