-- Migration: Adicionar colunas de documento/arquivo na tabela pendentes_manifestacao
-- Permite armazenar informações sobre documentos PDF capturados do PJE e armazenados no Google Drive

-- Adicionar colunas para informações de arquivo
alter table public.pendentes_manifestacao
add column arquivo_nome text,
add column arquivo_url_visualizacao text,
add column arquivo_url_download text;

-- Adicionar comments para documentação
comment on column public.pendentes_manifestacao.arquivo_nome is 'Nome do arquivo PDF do documento pendente armazenado no Google Drive (ex: pendentes/trt3g1/12345_1705856400000.pdf)';
comment on column public.pendentes_manifestacao.arquivo_url_visualizacao is 'URL de visualização do documento no Google Drive (webViewLink)';
comment on column public.pendentes_manifestacao.arquivo_url_download is 'URL de download do documento do Google Drive (webContentLink)';

-- Adicionar índice para facilitar filtros de "com documento" / "sem documento"
create index idx_pendentes_arquivo_nome on public.pendentes_manifestacao using btree (arquivo_nome) where arquivo_nome is not null;
