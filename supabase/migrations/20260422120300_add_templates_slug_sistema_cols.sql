-- Flag "sistema" e slug único em assinatura_digital_templates.
-- Seed do template de prestação de contas é feito por script separado
-- (scripts/database/seed-prestacao-contas-template.ts) porque depende
-- de upload para Backblaze B2 antes de popular arquivo_original (NOT NULL).

ALTER TABLE assinatura_digital_templates
  ADD COLUMN slug TEXT,
  ADD COLUMN sistema BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX ix_templates_slug_nao_nulo
  ON assinatura_digital_templates (slug)
  WHERE slug IS NOT NULL;

COMMENT ON COLUMN assinatura_digital_templates.sistema IS
  'Marca templates criados via seed e essenciais para features core. Não podem ser excluídos, apenas editados pelo admin.';
