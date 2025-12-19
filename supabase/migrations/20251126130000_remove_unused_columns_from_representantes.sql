-- Remove colunas que não existem na API do PJE para representantes (advogados)
-- Representantes são sempre pessoas físicas (advogados) e têm dados limitados

-- Campos de pessoa física que não vêm na API para representantes
alter table public.representantes drop column if exists data_nascimento;
alter table public.representantes drop column if exists nome_mae;
alter table public.representantes drop column if exists nome_pai;
alter table public.representantes drop column if exists nacionalidade;
alter table public.representantes drop column if exists estado_civil;
alter table public.representantes drop column if exists uf_nascimento;
alter table public.representantes drop column if exists municipio_nascimento;
alter table public.representantes drop column if exists pais_nascimento;

-- Campos de pessoa jurídica (representantes são sempre PF)
alter table public.representantes drop column if exists cnpj;
alter table public.representantes drop column if exists razao_social;
alter table public.representantes drop column if exists nome_fantasia;
alter table public.representantes drop column if exists inscricao_estadual;
alter table public.representantes drop column if exists tipo_empresa;

-- tipo_pessoa também não faz sentido pois representantes são sempre 'pf'
alter table public.representantes drop column if exists tipo_pessoa;
