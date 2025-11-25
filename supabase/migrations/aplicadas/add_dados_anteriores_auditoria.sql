-- Migration: Adicionar coluna dados_anteriores para auditoria nas três tabelas
-- Esta migration adiciona a coluna dados_anteriores (jsonb) para armazenar o estado anterior
-- dos registros antes da última atualização, permitindo auditoria completa das mudanças.

-- Tabela acervo
alter table public.acervo
add column dados_anteriores jsonb;

comment on column public.acervo.dados_anteriores is 'Armazena o estado anterior do registro antes da última atualização. Null quando o registro foi inserido ou quando não houve mudanças na última captura.';

-- Tabela audiencias
alter table public.audiencias
add column dados_anteriores jsonb;

comment on column public.audiencias.dados_anteriores is 'Armazena o estado anterior do registro antes da última atualização. Null quando o registro foi inserido ou quando não houve mudanças na última captura.';

-- Tabela pendentes_manifestacao
alter table public.pendentes_manifestacao
add column dados_anteriores jsonb;

comment on column public.pendentes_manifestacao.dados_anteriores is 'Armazena o estado anterior do registro antes da última atualização. Null quando o registro foi inserido ou quando não houve mudanças na última captura.';

