-- Colunas em parcelas para suportar fluxo público de prestação de contas.

ALTER TABLE parcelas
  ADD COLUMN dados_bancarios_snapshot JSONB,
  ADD COLUMN documento_assinatura_id BIGINT REFERENCES assinatura_digital_documentos(id) ON DELETE SET NULL;

CREATE INDEX ix_parcelas_documento_assinatura ON parcelas (documento_assinatura_id);

COMMENT ON COLUMN parcelas.dados_bancarios_snapshot IS
  'Snapshot imutável dos dados bancários usados neste repasse específico (banco, agência, conta, PIX, titular, timestamp). Preenchido pelo fluxo de prestação de contas pública; independente de mudanças futuras em dados_bancarios_cliente.';

COMMENT ON COLUMN parcelas.documento_assinatura_id IS
  'FK para o documento de assinatura digital gerado via fluxo público de prestação de contas. NULL quando declaração foi anexada manualmente pelo operador.';
