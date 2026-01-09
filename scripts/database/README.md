# Diagnóstico de Performance do Banco

Scripts de diagnóstico para investigar problemas de Disk I/O no Supabase. Útil quando o Dashboard sinaliza alto uso de disco, aumento de latência ou queda de cache hit rate.

## Quando executar
- Alertas de Disk I/O no painel do Supabase
- Lentidão percebida em consultas ou no app
- Após aplicar otimizações (índices, ajuste de queries) para comparar antes/depois

## Pré-requisitos
- Variáveis no `.env.local`: `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SECRET_KEY`
- Supabase CLI linkado ao projeto (`npx supabase link --project-ref <ref>`)
- Extensão `pg_stat_statements` habilitada (padrão no Supabase)

## Como rodar
```bash
npm run diagnostico:disk-io
```
O comando gera `DIAGNOSTICO_DISK_IO.md` na raiz com métricas e interpretações.

## O que é gerado
- Cache hit rate (index/table) com classificação ✅/⚠️/❌
- Top 20 queries por `max_time_ms` (consulta truncada para 180 caracteres)
- Tabelas com mais sequential scans (`pg_stat_user_tables`)
- Saída do Supabase CLI: `inspect db bloat` e `inspect db unused-indexes`
- Recomendações prioritárias de ação

## Interpretando resultados
- Cache hit rate <99%: investigar memória/índices; evitar SELECT *
- `max_time_ms` >1000: revisar plano, limitar colunas, adicionar índices
- `seq_scan` alto + `n_live_tup` grande: criar índices nas colunas filtradas/ordenadas
- Bloat >20%: executar VACUUM/REINDEX em janela de manutenção

## Referências
- Supabase Disk I/O: https://supabase.com/docs/guides/platform/database-usage#disk-io
- pg_stat_statements: https://www.postgresql.org/docs/current/pgstatstatements.html
