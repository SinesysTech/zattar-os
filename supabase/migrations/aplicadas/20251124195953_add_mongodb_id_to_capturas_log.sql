-- Adiciona campo mongodb_id para referenciar o documento bruto no MongoDB

-- Adicionar coluna mongodb_id
alter table public.capturas_log
  add column mongodb_id text;

comment on column public.capturas_log.mongodb_id is 'ID do documento no MongoDB (collection captura_logs_brutos) contendo o JSON bruto da raspagem';

-- Índice para buscas por mongodb_id
create index idx_capturas_log_mongodb_id on public.capturas_log using btree (mongodb_id);
