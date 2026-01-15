-- Migration: Adicionar campos de observações e quitação ao módulo de obrigações
--
-- Adiciona:
-- 1. Campo 'observacoes' em acordos_condenacoes - para notas gerais sobre o acordo
-- 2. Campo 'arquivo_quitacao_reclamante' em parcelas - para documento assinado pelo reclamante
-- 3. Campo 'data_quitacao_anexada' em parcelas - data em que a quitação foi anexada

-- Adicionar campo de observações na tabela acordos_condenacoes
alter table public.acordos_condenacoes
  add column if not exists observacoes text;

comment on column public.acordos_condenacoes.observacoes is
  'Observações gerais sobre o acordo, condenação ou custas processuais';

-- Adicionar campos de quitação na tabela parcelas
alter table public.parcelas
  add column if not exists arquivo_quitacao_reclamante text,
  add column if not exists data_quitacao_anexada timestamp with time zone;

comment on column public.parcelas.arquivo_quitacao_reclamante is
  'Path do arquivo com documento de quitação assinado pelo reclamante ao receber o valor';
comment on column public.parcelas.data_quitacao_anexada is
  'Data em que o documento de quitação foi anexado';
