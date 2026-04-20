-- =============================================================================
-- UNUSED INDEX ANALYSIS - 2026-04-20
-- =============================================================================
-- Snapshot do advisor 0005_unused_index. NAO APLICAR AUTOMATICAMENTE.
-- Revisar cada grupo, descomentar os DROPs desejados, aplicar como migration.
--
-- Metodo: pg_stat_user_indexes WHERE idx_scan = 0 no schema public, excluindo
-- PRIMARY KEYs, UNIQUE constraints e indexes que fazem backing de constraints.
-- Este filtro casa 1:1 com o advisor Supabase 0005_unused_index (verificado
-- em 2026-04-20: advisor=384 vs relatorio=383 DROPPABLE; a diferenca de 1 e
-- variacao temporal entre as duas medicoes).
--
-- Distribuicao:
--   DROP_LARGE    (>1MB)       1 indice,  9.2 MB    <- alto valor
--   DROP_MEDIUM   (100KB-1MB) 29 indices, 8.4 MB    <- alto valor
--   DROP_SMALL    (16-100KB)  34 indices, 1.3 MB    <- valor medio
--   DROP_TINY     (<16KB)    319 indices, 4.0 MB    <- baixo valor (mitigado)
--   SKIP_PK                   87 indices, 6.0 MB    <- nao dropavel
--   SKIP_UNIQUE               80 indices, 11 MB     <- nao dropavel
--
-- Sanity check - compara contagem do advisor com criterios deste relatorio.
-- Se divergir por mais que 1-2, investigue (possivel threshold novo no advisor):
--
--   SELECT COUNT(*) AS droppable
--   FROM pg_stat_user_indexes i
--   JOIN pg_index x ON x.indexrelid = i.indexrelid
--   WHERE i.schemaname = 'public' AND i.idx_scan = 0
--     AND NOT x.indisprimary AND NOT x.indisunique
--     AND NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conindid = i.indexrelid);
--
-- ANTES DE APLICAR UM DROP:
--   1. Rode pg_stat_statements procurando WHERE clauses ou JOINs usando a coluna:
--      SELECT query, calls FROM pg_stat_statements
--      WHERE query ILIKE '%<coluna>%' AND calls > 0;
--   2. Confirme com git log que o indice nao foi criado nas ultimas semanas
--      (indice novo pode nao ter tido tempo de acumular idx_scan).
--   3. Para indices em tabelas com 0 rows: confirme se a feature correspondente
--      esta ativa ou foi descontinuada.
--   4. Use CREATE INDEX CONCURRENTLY para recriar se o drop se mostrar ruim.
-- =============================================================================


-- =============================================================================
-- SECAO 1: DROP_LARGE (>1MB) + top DROP_MEDIUM
-- =============================================================================
-- Priorizados por tamanho. Cada bloco traz contexto (rows, write activity).
-- Indices em tabelas com 0 rows sao candidatos fortes (feature nao usada).


-- =========================================================================
-- [LARGE 9.2MB] public.embeddings.idx_embeddings_vector_cosine
-- Contexto: table_rows=0, write_activity=0
-- Tipo: HNSW vector_cosine_ops (pgvector)
-- Nota: HNSW e caro de rebuild. Confirmar se a feature de embeddings esta
-- desativada antes de dropar; se vai ativar em breve, mantenha.
-- -------------------------------------------------------------------------
-- DROP INDEX IF EXISTS public.idx_embeddings_vector_cosine;


-- =========================================================================
-- [MEDIUM 520KB] public.enderecos.idx_enderecos_cep
-- Contexto: table_rows=19717, write_activity=13788 (tabela ATIVA)
-- WHERE cep IS NOT NULL
-- Nota: tabela ativa mas nenhuma query usa CEP direto. Candidato forte a DROP.
-- -------------------------------------------------------------------------
-- DROP INDEX IF EXISTS public.idx_enderecos_cep;


-- =========================================================================
-- [MEDIUM 488KB] public.processos_cliente_por_cpf.idx_processos_cliente_cpf_numero
-- Contexto: table_rows=0, write_activity=0 (tabela VAZIA)
-- Nota: feature ainda nao iniciada; seguro dropar se nao ha plano proximo.
-- -------------------------------------------------------------------------
-- DROP INDEX IF EXISTS public.idx_processos_cliente_cpf_numero;


-- =========================================================================
-- [MEDIUM 480KB] public.acervo_unificado.idx_acervo_unificado_trt_origem
-- Contexto: table_rows=21279, write_activity=10767 (MV ATIVA)
-- Nota: coluna trt_origem nao esta sendo usada em filtros. Candidato a DROP,
-- porem MV pode ter queries esporadicas; verificar relatórios.
-- -------------------------------------------------------------------------
-- DROP INDEX IF EXISTS public.idx_acervo_unificado_trt_origem;


-- =========================================================================
-- [MEDIUM 432KB] public.orgaos_tribunais."TribunalOrgao_tribunalId_idx"
-- Contexto: table_rows=0 (tabela VAZIA, nao populada)
-- Nota: remanescente de schema Prisma. Candidato forte a DROP.
-- -------------------------------------------------------------------------
-- DROP INDEX IF EXISTS public."TribunalOrgao_tribunalId_idx";


-- =========================================================================
-- [MEDIUM 424KB] public.comunica_cnj.idx_comunica_cnj_id_cnj
-- Contexto: table_rows=9851, write_activity=0 (tabela populada, sem escritas)
-- Nota: write_activity=0 mas 9851 rows = tabela importada em bulk. Pode ter
-- queries de leitura via id_cnj. Confirmar antes de dropar.
-- -------------------------------------------------------------------------
-- DROP INDEX IF EXISTS public.idx_comunica_cnj_id_cnj;


-- =========================================================================
-- [MEDIUM 408KB] public.notificacoes.idx_notificacoes_lida
-- Contexto: table_rows=54601, write_activity=3713 (tabela ATIVA)
-- Partial index: (usuario_id, lida) WHERE lida=false
-- Nota: seria util para "minhas notificacoes nao lidas". Idx_scan=0 sugere
-- que queries nao usam essas condicoes. Verificar no codigo antes.
-- -------------------------------------------------------------------------
-- DROP INDEX IF EXISTS public.idx_notificacoes_lida;


-- =========================================================================
-- [MEDIUM 392KB] public.clientes.idx_clientes_endereco_id
-- Contexto: table_rows=7214, write_activity=5866 (tabela ATIVA)
-- Nota: Partial index em endereco_id. Verificar se JOIN cliente->endereco
-- usa esta coluna. Se sim, talvez PG prefira seq_scan para 7k rows.
-- -------------------------------------------------------------------------
-- DROP INDEX IF EXISTS public.idx_clientes_endereco_id;


-- =========================================================================
-- [MEDIUM 376KB] public.logs_alteracao.idx_logs_alteracao_dados_evento
-- Contexto: table_rows=1961, write_activity=328
-- Tipo: GIN em dados_evento (JSONB)
-- Nota: GIN e caro para writes. Se logs nao sao consultados via filtros em
-- dados_evento, dropar libera custo de insert.
-- -------------------------------------------------------------------------
-- DROP INDEX IF EXISTS public.idx_logs_alteracao_dados_evento;


-- =========================================================================
-- [MEDIUM 344KB] public.expedientes.idx_pendentes_arquivo_key
-- Contexto: table_rows=1776, write_activity=6205 (tabela MUITO ATIVA)
-- WHERE arquivo_key IS NOT NULL
-- Nota: write_activity > rows sugere updates frequentes. Se o filtro nao e
-- usado em queries, o custo de manter o indice nao vale.
-- -------------------------------------------------------------------------
-- DROP INDEX IF EXISTS public.idx_pendentes_arquivo_key;


-- =========================================================================
-- [MEDIUM 328KB] public.clientes.idx_clientes_cpf
-- Contexto: table_rows=7214, write_activity=5866 (tabela ATIVA)
-- WHERE cpf IS NOT NULL
-- Nota: existe clientes_cpf_key (UNIQUE) que cobre buscas por CPF. Este
-- parcial e redundante. Candidato forte a DROP.
-- -------------------------------------------------------------------------
-- DROP INDEX IF EXISTS public.idx_clientes_cpf;


-- =========================================================================
-- [MEDIUM 320KB] public.orgaos_tribunais."TribunalOrgao_ativo_idx"
-- Contexto: table_rows=0 (tabela VAZIA)
-- -------------------------------------------------------------------------
-- DROP INDEX IF EXISTS public."TribunalOrgao_ativo_idx";


-- =========================================================================
-- [MEDIUM 312KB] public.comunica_cnj.idx_comunica_cnj_numero_processo
-- Contexto: table_rows=9851, write_activity=0
-- Nota: similar ao idx_comunica_cnj_id_cnj. Verificar queries.
-- -------------------------------------------------------------------------
-- DROP INDEX IF EXISTS public.idx_comunica_cnj_numero_processo;


-- =========================================================================
-- [MEDIUM 304KB] public.enderecos.idx_enderecos_municipio_ibge
-- Contexto: table_rows=19717, write_activity=13788 (tabela ATIVA)
-- WHERE municipio_ibge IS NOT NULL
-- -------------------------------------------------------------------------
-- DROP INDEX IF EXISTS public.idx_enderecos_municipio_ibge;


-- =========================================================================
-- [MEDIUM 280KB] public.acervo.idx_acervo_classe_judicial_id
-- Contexto: table_rows=38757, write_activity=7639 (tabela ATIVA)
-- Nota: CRIADO EM 20260420130300_fase4_fk_covering_indexes. Aguardando
-- primeiro uso (DELETE em cascata ou JOIN em classe_judicial).
-- NAO DROPAR - e o FK index recem-criado. Se continuar unused em 1 mes,
-- revisitar; ate la, manter.
-- -------------------------------------------------------------------------
-- Nao sugerido drop.


-- =========================================================================
-- [MEDIUM 264KB] public.cadastros_pje.idx_cadastros_pje_tribunal
-- Contexto: table_rows=15381, write_activity=32750 (ALTA rotatividade)
-- Nota: composite (tribunal, sistema). Se queries filtrarem so por sistema,
-- indice nao e usado. Validar no codigo.
-- -------------------------------------------------------------------------
-- DROP INDEX IF EXISTS public.idx_cadastros_pje_tribunal;


-- =========================================================================
-- [MEDIUM 264KB] public.processos_cliente_por_cpf.idx_processos_cliente_cpf_busca
-- Contexto: table_rows=0 (tabela VAZIA)
-- -------------------------------------------------------------------------
-- DROP INDEX IF EXISTS public.idx_processos_cliente_cpf_busca;


-- =========================================================================
-- [MEDIUM 264KB] public.expedientes.idx_pendentes_arquivo_nome
-- Contexto: table_rows=1776, write_activity=6205
-- -------------------------------------------------------------------------
-- DROP INDEX IF EXISTS public.idx_pendentes_arquivo_nome;


-- =========================================================================
-- [MEDIUM 256KB] public.embeddings.idx_embeddings_metadata_gin
-- Contexto: table_rows=0 (feature nao iniciada)
-- -------------------------------------------------------------------------
-- DROP INDEX IF EXISTS public.idx_embeddings_metadata_gin;


-- =========================================================================
-- [MEDIUM 240KB] public.expedientes.idx_pendentes_advogado_id
-- Contexto: table_rows=1776, write_activity=6205
-- Nota: SUSPEITO. advogado_id provavelmente e o filtro mais comum em expedientes.
-- Verificar se existe outro indice composite que ja cobre (ex: advogado_id, status).
-- -------------------------------------------------------------------------
-- DROP INDEX IF EXISTS public.idx_pendentes_advogado_id;


-- =========================================================================
-- [MEDIUM 240KB] public.expedientes.idx_expedientes_origem
-- Contexto: table_rows=1776, write_activity=6205
-- -------------------------------------------------------------------------
-- DROP INDEX IF EXISTS public.idx_expedientes_origem;


-- =========================================================================
-- [MEDIUM 224KB] public.processo_partes.idx_processo_partes_representante_entidade
-- Contexto: table_rows=84611, write_activity=13943 (tabela GRANDE)
-- Partial: WHERE tipo_entidade='representante'
-- -------------------------------------------------------------------------
-- DROP INDEX IF EXISTS public.idx_processo_partes_representante_entidade;


-- =========================================================================
-- [MEDIUM 208KB] public.comunica_cnj.idx_comunica_cnj_sigla_tribunal
-- Contexto: table_rows=9851, write_activity=0
-- -------------------------------------------------------------------------
-- DROP INDEX IF EXISTS public.idx_comunica_cnj_sigla_tribunal;


-- =========================================================================
-- [MEDIUM 168KB] public.contratos.idx_contratos_estagio_id
-- Contexto: table_rows=4605, write_activity=1147
-- -------------------------------------------------------------------------
-- DROP INDEX IF EXISTS public.idx_contratos_estagio_id;


-- =========================================================================
-- [MEDIUM 160KB] public.contratos.idx_contratos_tipo_cobranca_id
-- Contexto: table_rows=4605, write_activity=1147
-- -------------------------------------------------------------------------
-- DROP INDEX IF EXISTS public.idx_contratos_tipo_cobranca_id;


-- =========================================================================
-- [MEDIUM 152KB] public.contratos.idx_contratos_tipo_contrato
-- Contexto: table_rows=4605. Existe idx_contratos_tipo_contrato_id (ID numerico).
-- Este e por texto. Possivel duplicacao.
-- -------------------------------------------------------------------------
-- DROP INDEX IF EXISTS public.idx_contratos_tipo_contrato;


-- =========================================================================
-- [MEDIUM 144KB] public.contratos.idx_contratos_tipo_contrato_id
-- Contexto: table_rows=4605
-- -------------------------------------------------------------------------
-- DROP INDEX IF EXISTS public.idx_contratos_tipo_contrato_id;


-- =========================================================================
-- [MEDIUM 136KB] public.contratos.idx_contratos_created_by
-- Contexto: table_rows=4605
-- -------------------------------------------------------------------------
-- DROP INDEX IF EXISTS public.idx_contratos_created_by;


-- =========================================================================
-- [MEDIUM 136KB] public.contrato_status_historico.idx_contrato_status_historico_changed_at
-- Contexto: table_rows=4800, write_activity=1135
-- -------------------------------------------------------------------------
-- DROP INDEX IF EXISTS public.idx_contrato_status_historico_changed_at;


-- =========================================================================
-- [MEDIUM 120KB] public.contrato_partes.idx_contrato_partes_papel
-- Contexto: table_rows=9060, write_activity=4189
-- -------------------------------------------------------------------------
-- DROP INDEX IF EXISTS public.idx_contrato_partes_papel;


-- =============================================================================
-- SECAO 2: DROP_SMALL e DROP_TINY (34 + 320 indices)
-- =============================================================================
-- Nao listados individualmente - ganho marginal nao justifica revisao 1-a-1.
-- Para gerar lista completa, rode esta query:
--
--   SELECT
--     'DROP INDEX IF EXISTS ' || quote_ident(i.schemaname) || '.' || quote_ident(i.indexrelname) || ';' AS stmt,
--     pg_size_pretty(pg_relation_size(i.indexrelid)) AS size,
--     i.relname AS tbl,
--     s.n_live_tup AS rows
--   FROM pg_stat_user_indexes i
--   JOIN pg_index x ON x.indexrelid = i.indexrelid
--   JOIN pg_stat_user_tables s ON s.relid = i.relid
--   WHERE i.schemaname = 'public' AND i.idx_scan = 0
--     AND NOT x.indisprimary AND NOT x.indisunique
--     AND NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conindid = i.indexrelid)
--     AND pg_relation_size(i.indexrelid) BETWEEN 16385 AND 100000
--   ORDER BY pg_relation_size(i.indexrelid) DESC;
