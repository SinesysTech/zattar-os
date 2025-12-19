-- Adiciona coluna dados_adicionais na tabela conciliacoes_bancarias
alter table public.conciliacoes_bancarias
add column if not exists dados_adicionais jsonb;

comment on column public.conciliacoes_bancarias.dados_adicionais is
  'Dados adicionais da conciliacao (ex.: sugestoes salvas para revisao)';
