-- Remove o índice parcial que não funciona com ON CONFLICT
drop index if exists public.idx_representantes_unique_por_processo;

-- Cria uma constraint única real (não parcial) para permitir ON CONFLICT
-- Usa COALESCE para tratar valores NULL
alter table public.representantes
add constraint uq_representantes_por_processo
unique (id_pessoa_pje, parte_id, parte_tipo, trt, grau, numero_processo);
