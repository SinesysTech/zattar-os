-- Migration: Permitir criação manual de audiências (id_pje nullable)
--
-- Contexto: a tabela audiencias foi originalmente projetada apenas para
-- audiências capturadas do PJe, onde id_pje sempre existe. O suporte à
-- criação manual via NovaAudienciaDialog falha porque o INSERT não fornece
-- id_pje, violando a constraint NOT NULL.
--
-- A função isAudienciaCapturada (domain.ts) já distingue as duas origens
-- via `typeof idPje === 'number' && idPje > 0`, portanto a aplicação está
-- pronta — só falta permitir NULL no banco.
--
-- A unique constraint (id_pje, trt, grau, numero_processo) continua válida:
-- em PostgreSQL, NULL != NULL, portanto múltiplas audiências manuais
-- (id_pje = NULL) não colidem entre si.

alter table public.audiencias
  alter column id_pje drop not null;

comment on column public.audiencias.id_pje is
  'ID da audiência no sistema PJE. NULL para audiências criadas manualmente no painel.';

-- Recriar o índice como parcial (apenas quando id_pje não é null),
-- evitando que NULLs ocupem espaço desnecessário no índice.
drop index if exists public.idx_audiencias_id_pje;

create index idx_audiencias_id_pje
  on public.audiencias(id_pje)
  where id_pje is not null;
