-- Adiciona colunas de contexto do processo à tabela representantes
-- Necessário para identificar representantes por processo específico

-- Coluna trt (tribunal)
alter table public.representantes
add column if not exists trt varchar(10);

comment on column public.representantes.trt is 'Código do TRT (ex: trt1, trt2, etc)';

-- Coluna grau (primeiro ou segundo grau)
alter table public.representantes
add column if not exists grau varchar(2);

comment on column public.representantes.grau is 'Grau do processo: 1 (primeiro grau) ou 2 (segundo grau)';

-- Coluna numero_processo
alter table public.representantes
add column if not exists numero_processo varchar(25);

comment on column public.representantes.numero_processo is 'Número do processo no formato CNJ';

-- Criar índice para busca por processo
create index if not exists idx_representantes_processo
on public.representantes(numero_processo, trt, grau);

-- Criar índice único composto para evitar duplicatas
-- (um representante por parte por processo)
create unique index if not exists idx_representantes_unique_por_processo
on public.representantes(id_pessoa_pje, parte_id, parte_tipo, trt, grau, numero_processo)
where trt is not null and grau is not null and numero_processo is not null;
