-- Adicionar coluna dados_anteriores na tabela acervo
-- Todas as outras tabelas de entidades já possuem esta coluna (audiencias, expedientes, clientes, etc.)
-- Usada pelo serviço de persistência para armazenar snapshot dos dados antes de atualizar
alter table public.acervo
  add column if not exists dados_anteriores jsonb default null;

comment on column public.acervo.dados_anteriores is 'Snapshot dos dados anteriores antes da última atualização (usado pela captura para auditoria)';
