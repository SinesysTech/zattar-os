-- Migration: Renomear TribunalConfig para tribunais_config e atualizar estrutura
-- Data: 2025-11-22
-- Descrição: Renomeia tabela e colunas de camelCase para snake_case,
--            adiciona 'tribunal_superior' ao enum grau_tribunal,
--            cria enum tipo_acesso_tribunal para configurações de captura,
--            e adiciona comentários descritivos

-- 1. Adicionar 'tribunal_superior' ao enum grau_tribunal (usado em processos/audiências/pendentes)
ALTER TYPE grau_tribunal ADD VALUE IF NOT EXISTS 'tribunal_superior';

-- 2. Criar novo enum tipo_acesso_tribunal (usado em tribunais_config)
CREATE TYPE tipo_acesso_tribunal AS ENUM (
    'primeiro_grau',      -- Login específico para primeiro grau (TRTs)
    'segundo_grau',       -- Login específico para segundo grau (TRTs)
    'unificado',          -- Login unificado acessa 1º e 2º grau (TJs, TRFs)
    'unico'               -- Login único para tribunal superior (TST, STF, STJ)
);

-- 3. Renomear tabela
ALTER TABLE "TribunalConfig" RENAME TO tribunais_config;

-- 4. Renomear colunas para snake_case
ALTER TABLE tribunais_config RENAME COLUMN "tribunalId" TO tribunal_id;
ALTER TABLE tribunais_config RENAME COLUMN "urlBase" TO url_base;
ALTER TABLE tribunais_config RENAME COLUMN "urlLoginSeam" TO url_login_seam;
ALTER TABLE tribunais_config RENAME COLUMN "urlApi" TO url_api;
ALTER TABLE tribunais_config RENAME COLUMN "customTimeouts" TO custom_timeouts;
ALTER TABLE tribunais_config RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE tribunais_config RENAME COLUMN "updatedAt" TO updated_at;

-- 5. Adicionar nova coluna tipo_acesso com enum tipo_acesso_tribunal
ALTER TABLE tribunais_config ADD COLUMN tipo_acesso tipo_acesso_tribunal;

-- 6. Migrar dados: converter '1g' -> 'primeiro_grau', '2g' -> 'segundo_grau', 'unico' -> 'unico'
UPDATE tribunais_config
SET tipo_acesso = CASE
    WHEN grau = '1g' THEN 'primeiro_grau'::tipo_acesso_tribunal
    WHEN grau = '2g' THEN 'segundo_grau'::tipo_acesso_tribunal
    WHEN grau = 'unico' THEN 'unico'::tipo_acesso_tribunal
    ELSE NULL
END;

-- 7. Validar que todos os registros foram migrados (não pode ter NULL)
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count FROM tribunais_config WHERE tipo_acesso IS NULL;
    IF null_count > 0 THEN
        RAISE EXCEPTION 'Migração de tipo_acesso falhou: % registros com tipo_acesso NULL', null_count;
    END IF;
END $$;

-- 8. Remover coluna antiga grau
ALTER TABLE tribunais_config DROP COLUMN grau;

-- 9. Tornar coluna tipo_acesso NOT NULL
ALTER TABLE tribunais_config ALTER COLUMN tipo_acesso SET NOT NULL;

-- 10. Adicionar comentários descritivos na tabela e colunas
COMMENT ON TABLE tribunais_config IS 'Configurações de acesso aos tribunais para captura do PJE-TRT, TJs, TRFs e Tribunais Superiores. Contém URLs de login, API e base, além de timeouts customizados por tribunal e tipo de acesso.';

COMMENT ON COLUMN tribunais_config.id IS 'Identificador único da configuração';
COMMENT ON COLUMN tribunais_config.sistema IS 'Sistema de processo judicial (PJE, PROJUDI, ESAJ, etc)';
COMMENT ON COLUMN tribunais_config.tipo_acesso IS 'Tipo de acesso ao sistema: primeiro_grau (login específico 1º grau TRT), segundo_grau (login específico 2º grau TRT), unificado (login único para 1º e 2º grau TJ/TRF), unico (login único tribunal superior TST/STF/STJ)';
COMMENT ON COLUMN tribunais_config.url_base IS 'URL base do tribunal (ex: https://pje.trt1.jus.br)';
COMMENT ON COLUMN tribunais_config.url_login_seam IS 'URL completa da página de login SSO (ex: https://pje.trt1.jus.br/primeirograu/login.seam)';
COMMENT ON COLUMN tribunais_config.url_api IS 'URL da API REST do sistema (ex: https://pje.trt1.jus.br/pje-comum-api/api)';
COMMENT ON COLUMN tribunais_config.custom_timeouts IS 'Timeouts customizados em JSONB (opcional). Estrutura: { login?: number, redirect?: number, networkIdle?: number, api?: number }. Valores em milissegundos.';
COMMENT ON COLUMN tribunais_config.created_at IS 'Data e hora de criação do registro';
COMMENT ON COLUMN tribunais_config.updated_at IS 'Data e hora da última atualização do registro';
COMMENT ON COLUMN tribunais_config.tribunal_id IS 'Referência ao tribunal na tabela tribunais (FK)';

-- 11. Validar quantidade de configurações
DO $$
DECLARE
    total_configs INTEGER;
    config_trt_1g INTEGER;
    config_trt_2g INTEGER;
    config_unificado INTEGER;
    config_unico INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_configs FROM tribunais_config;
    SELECT COUNT(*) INTO config_trt_1g FROM tribunais_config WHERE tipo_acesso = 'primeiro_grau';
    SELECT COUNT(*) INTO config_trt_2g FROM tribunais_config WHERE tipo_acesso = 'segundo_grau';
    SELECT COUNT(*) INTO config_unificado FROM tribunais_config WHERE tipo_acesso = 'unificado';
    SELECT COUNT(*) INTO config_unico FROM tribunais_config WHERE tipo_acesso = 'unico';

    RAISE NOTICE 'Validação de Configurações:';
    RAISE NOTICE '  Total: % configs', total_configs;
    RAISE NOTICE '  TRT Primeiro Grau: % configs', config_trt_1g;
    RAISE NOTICE '  TRT Segundo Grau: % configs', config_trt_2g;
    RAISE NOTICE '  Acesso Unificado (TJ/TRF): % configs', config_unificado;
    RAISE NOTICE '  Único (Tribunal Superior): % configs', config_unico;
END $$;

-- 12. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_tribunais_config_tribunal_id ON tribunais_config(tribunal_id);
CREATE INDEX IF NOT EXISTS idx_tribunais_config_tipo_acesso ON tribunais_config(tipo_acesso);
CREATE INDEX IF NOT EXISTS idx_tribunais_config_tribunal_tipo ON tribunais_config(tribunal_id, tipo_acesso);

-- 13. Atualizar foreign key name (manter consistência)
ALTER TABLE tribunais_config
  RENAME CONSTRAINT "TribunalConfig_tribunalId_fkey"
  TO tribunais_config_tribunal_id_fkey;
