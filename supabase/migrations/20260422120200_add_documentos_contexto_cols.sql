-- Colunas de contexto em assinatura_digital_documentos — permite rastrear
-- de onde veio um documento (prestação de contas, contrato, etc).

ALTER TABLE assinatura_digital_documentos
  ADD COLUMN tipo_contexto TEXT CHECK (tipo_contexto IN ('generico', 'prestacao_contas', 'contrato')) DEFAULT 'generico',
  ADD COLUMN contexto_parcela_id BIGINT REFERENCES parcelas(id) ON DELETE SET NULL,
  ADD COLUMN template_id BIGINT REFERENCES assinatura_digital_templates(id) ON DELETE SET NULL;

CREATE INDEX ix_assinatura_digital_documentos_parcela
  ON assinatura_digital_documentos (contexto_parcela_id);

UPDATE assinatura_digital_documentos SET tipo_contexto = 'generico' WHERE tipo_contexto IS NULL;
