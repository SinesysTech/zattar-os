-- Migration: Adicionar suporte a integração nativa Dify na tabela assistentes
-- Permite que assistentes sejam vinculados a apps Dify para renderização nativa (chat, workflow, completion)

-- 1. Adicionar coluna tipo (default 'iframe' para retrocompatibilidade com registros existentes)
ALTER TABLE assistentes ADD COLUMN tipo TEXT NOT NULL DEFAULT 'iframe';
ALTER TABLE assistentes ADD CONSTRAINT chk_assistente_tipo CHECK (tipo IN ('iframe', 'dify'));

-- 2. Adicionar FK para dify_apps (nullable - só preenchida quando tipo='dify')
ALTER TABLE assistentes ADD COLUMN dify_app_id UUID REFERENCES dify_apps(id) ON DELETE CASCADE;

-- 3. iframe_code agora é nullable (não necessário para tipo='dify')
ALTER TABLE assistentes ALTER COLUMN iframe_code DROP NOT NULL;

-- 4. Índice para busca eficiente por dify_app_id
CREATE INDEX idx_assistentes_dify_app_id ON assistentes(dify_app_id) WHERE dify_app_id IS NOT NULL;

-- 5. Constraint de integridade: cada tipo exige seus campos
ALTER TABLE assistentes ADD CONSTRAINT chk_assistente_config
  CHECK (
    (tipo = 'iframe' AND iframe_code IS NOT NULL) OR
    (tipo = 'dify' AND dify_app_id IS NOT NULL)
  );
