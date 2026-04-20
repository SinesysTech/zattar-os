# Supabase Analysis

Relatórios pontuais de análise do banco Supabase. Não são migrations — são
documentos de suporte para decisões de DBA/cleanup.

## unused_indexes_YYYY-MM-DD.sql

Snapshot do advisor `0005_unused_index` filtrado por:

- Schema `public` apenas
- `idx_scan = 0` (nunca foi usado)
- Exclui PRIMARY KEYs, UNIQUE constraints e indexes que fazem backing de constraints

Esses filtros **batem 1:1 com o que o advisor Supabase reporta** (verificado
em 2026-04-20: advisor=384 vs relatório=383; diferença de 1 é variação temporal
entre medições — índice cruza o threshold entre uma consulta e outra).

Se o relatório divergir do advisor em mais que ~2, rode o sanity-check incluído
no próprio arquivo SQL antes de tomar decisões.

### Como usar

1. Abra o arquivo mais recente (`unused_indexes_<DATA>.sql`).
2. Revise cada bloco — contexto (rows, write_activity, tipo de índice) indica
   se o DROP é seguro.
3. Antes de aplicar um DROP, consulte `pg_stat_statements` e o código para
   confirmar que nenhuma query futura precisaria do índice.
4. Descomente os DROPs desejados e aplique como migration em
   `supabase/migrations/YYYYMMDDHHMMSS_drop_unused_indexes.sql`.
5. Se o drop for ruim, recrie com `CREATE INDEX CONCURRENTLY`.

### Política

- Índices criados nas últimas 2-4 semanas são "jovens" — advisor pode reportar
  como unused antes de acumular scans. Prefira dropar índices antigos.
- Índices em tabelas com 0 rows são candidatos fortes (feature inativa).
- Índices em tabelas ativas mas nunca usados sugerem padrão de query incorreto
  — revisar código antes de dropar.
