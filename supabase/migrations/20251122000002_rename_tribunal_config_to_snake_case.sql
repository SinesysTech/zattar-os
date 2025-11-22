-- Migration: Renomear TribunalConfig para tribunais_config e atualizar estrutura
-- Data: 2025-11-22
-- Descrição: Renomeia tabela e colunas de camelCase para snake_case,
--            atualiza enum de grau, e adiciona comentários descritivos

-- 1. Renomear tabela
ALTER TABLE "TribunalConfig" RENAME TO tribunais_config;

-- 2. Renomear colunas para snake_case
ALTER TABLE tribunais_config RENAME COLUMN "tribunalId" TO tribunal_id;
ALTER TABLE tribunais_config RENAME COLUMN "urlBase" TO url_base;
ALTER TABLE tribunais_config RENAME COLUMN "urlLoginSeam" TO url_login_seam;
ALTER TABLE tribunais_config RENAME COLUMN "urlApi" TO url_api;
ALTER TABLE tribunais_config RENAME COLUMN "customTimeouts" TO custom_timeouts;
ALTER TABLE tribunais_config RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE tribunais_config RENAME COLUMN "updatedAt" TO updated_at;

-- 3. Adicionar nova coluna com enum grau_tribunal
ALTER TABLE tribunais_config ADD COLUMN grau_enum grau_tribunal;

-- 4. Migrar dados: converter '1g' -> 'primeiro_grau' e '2g' -> 'segundo_grau'
UPDATE tribunais_config
SET grau_enum = CASE
    WHEN grau = '1g' THEN 'primeiro_grau'::grau_tribunal
    WHEN grau = '2g' THEN 'segundo_grau'::grau_tribunal
    ELSE NULL
END;

-- 5. Validar que todos os registros foram migrados (não pode ter NULL)
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count FROM tribunais_config WHERE grau_enum IS NULL;
    IF null_count > 0 THEN
        RAISE EXCEPTION 'Migração de grau falhou: % registros com grau_enum NULL', null_count;
    END IF;
END $$;

-- 6. Remover coluna antiga grau
ALTER TABLE tribunais_config DROP COLUMN grau;

-- 7. Renomear grau_enum para grau
ALTER TABLE tribunais_config RENAME COLUMN grau_enum TO grau;

-- 8. Tornar coluna grau NOT NULL
ALTER TABLE tribunais_config ALTER COLUMN grau SET NOT NULL;

-- 9. Adicionar comentários descritivos na tabela e colunas
COMMENT ON TABLE tribunais_config IS 'Configurações de acesso aos tribunais para captura do PJE-TRT. Contém URLs de login, API e base, além de timeouts customizados por tribunal e grau.';

COMMENT ON COLUMN tribunais_config.id IS 'Identificador único da configuração';
COMMENT ON COLUMN tribunais_config.sistema IS 'Sistema de processo judicial (PJE para Tribunais Regionais do Trabalho)';
COMMENT ON COLUMN tribunais_config.grau IS 'Grau do tribunal: primeiro_grau ou segundo_grau';
COMMENT ON COLUMN tribunais_config.url_base IS 'URL base do tribunal (ex: https://pje.trt1.jus.br)';
COMMENT ON COLUMN tribunais_config.url_login_seam IS 'URL completa da página de login SSO (ex: https://pje.trt1.jus.br/primeirograu/login.seam)';
COMMENT ON COLUMN tribunais_config.url_api IS 'URL da API REST do PJE (ex: https://pje.trt1.jus.br/pje-comum-api/api)';
COMMENT ON COLUMN tribunais_config.custom_timeouts IS 'Timeouts customizados em JSONB (opcional). Estrutura: { login?: number, redirect?: number, networkIdle?: number, api?: number }. Valores em milissegundos.';
COMMENT ON COLUMN tribunais_config.created_at IS 'Data e hora de criação do registro';
COMMENT ON COLUMN tribunais_config.updated_at IS 'Data e hora da última atualização do registro';
COMMENT ON COLUMN tribunais_config.tribunal_id IS 'Referência ao tribunal na tabela tribunais (FK)';

-- 10. Validar que todos os 48 registros esperados existem (24 TRTs × 2 graus)
DO $$
DECLARE
    total_configs INTEGER;
    expected_configs INTEGER := 48; -- 24 TRTs × 2 graus
BEGIN
    SELECT COUNT(*) INTO total_configs FROM tribunais_config;

    IF total_configs < expected_configs THEN
        RAISE WARNING 'Atenção: esperado % configurações, mas encontrado apenas %. Verifique se todos os TRTs possuem configuração para ambos os graus.', expected_configs, total_configs;
    ELSIF total_configs = expected_configs THEN
        RAISE NOTICE 'Validação OK: % configurações encontradas (24 TRTs × 2 graus)', total_configs;
    ELSE
        RAISE NOTICE 'Encontrado % configurações (mais que o esperado de %)', total_configs, expected_configs;
    END IF;
END $$;

-- 11. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_tribunais_config_tribunal_id ON tribunais_config(tribunal_id);
CREATE INDEX IF NOT EXISTS idx_tribunais_config_grau ON tribunais_config(grau);
CREATE INDEX IF NOT EXISTS idx_tribunais_config_tribunal_grau ON tribunais_config(tribunal_id, grau);

-- 12. Atualizar foreign key name se necessário (manter consistência)
-- A FK já existe como TribunalConfig_tribunalId_fkey, vamos renomear
ALTER TABLE tribunais_config
  RENAME CONSTRAINT "TribunalConfig_tribunalId_fkey"
  TO tribunais_config_tribunal_id_fkey;
