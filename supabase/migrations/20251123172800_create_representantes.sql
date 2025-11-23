-- Migration: Create representantes table
-- Description: Legal representatives (lawyers) who act on behalf of parties in legal processes
-- Total campos: 45

-- Create representantes table
CREATE TABLE IF NOT EXISTS representantes (
  -- Identification (5 campos)
  id SERIAL PRIMARY KEY,
  id_pje INTEGER,
  id_pessoa_pje INTEGER NOT NULL,
  trt VARCHAR(10) NOT NULL,
  grau VARCHAR(1) NOT NULL CHECK (grau IN ('1', '2')),

  -- Context (4 campos)
  parte_tipo VARCHAR(20) NOT NULL CHECK (parte_tipo IN ('cliente', 'parte_contraria', 'terceiro')),
  parte_id INTEGER NOT NULL,
  numero_processo VARCHAR(50) NOT NULL,
  polo VARCHAR(20),

  -- Common (6 campos)
  tipo_pessoa VARCHAR(2) NOT NULL CHECK (tipo_pessoa IN ('pf', 'pj')),
  nome VARCHAR(500) NOT NULL,
  situacao VARCHAR(10),
  status VARCHAR(10),
  principal BOOLEAN,
  endereco_desconhecido BOOLEAN,

  -- Lawyer-specific (4 campos)
  tipo VARCHAR(50),
  id_tipo_parte INTEGER,
  numero_oab VARCHAR(20),
  situacao_oab VARCHAR(20),

  -- Contact (6 campos)
  emails TEXT[],
  ddd_celular VARCHAR(5),
  numero_celular VARCHAR(20),
  ddd_telefone VARCHAR(5),
  numero_telefone VARCHAR(20),
  email VARCHAR(255),

  -- PF-only (10 campos)
  cpf VARCHAR(11),
  sexo VARCHAR(20),
  data_nascimento DATE,
  nome_mae VARCHAR(500),
  nome_pai VARCHAR(500),
  nacionalidade VARCHAR(100),
  estado_civil VARCHAR(50),
  uf_nascimento VARCHAR(2),
  municipio_nascimento VARCHAR(200),
  pais_nascimento VARCHAR(100),

  -- PJ-only (5 campos)
  cnpj VARCHAR(14),
  razao_social VARCHAR(500),
  nome_fantasia VARCHAR(500),
  inscricao_estadual VARCHAR(50),
  tipo_empresa VARCHAR(100),

  -- Metadata (5 campos)
  dados_pje_completo JSONB,
  ordem INTEGER,
  data_habilitacao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Uniqueness constraint: prevent duplicate lawyer for same party in same process/context
  CONSTRAINT unique_representante_context UNIQUE (id_pessoa_pje, trt, grau, parte_id, parte_tipo, numero_processo),

  -- Data validation constraints
  CONSTRAINT check_pf_cpf CHECK (tipo_pessoa != 'pf' OR cpf IS NOT NULL),
  CONSTRAINT check_pf_cnpj_null CHECK (tipo_pessoa != 'pf' OR cnpj IS NULL),
  CONSTRAINT check_pj_cnpj CHECK (tipo_pessoa != 'pj' OR cnpj IS NOT NULL),
  CONSTRAINT check_pj_cpf_null CHECK (tipo_pessoa != 'pj' OR cpf IS NULL)
);

-- Add table comment
COMMENT ON TABLE representantes IS 'Legal representatives (advogados) who act on behalf of parties in legal processes. Data sourced from PJE-TRT API.';

-- Add column comments
COMMENT ON COLUMN representantes.id IS 'Primary key - sequential ID';
COMMENT ON COLUMN representantes.id_pje IS 'PJE internal ID for this representante record';
COMMENT ON COLUMN representantes.id_pessoa_pje IS 'PJE pessoa ID - used for deduplication';
COMMENT ON COLUMN representantes.trt IS 'Tribunal Regional do Trabalho (e.g., "3", "15")';
COMMENT ON COLUMN representantes.grau IS 'Grau: "1" for primeiro_grau, "2" for segundo_grau';
COMMENT ON COLUMN representantes.parte_tipo IS 'Type of party represented: cliente, parte_contraria, terceiro';
COMMENT ON COLUMN representantes.parte_id IS 'Foreign key to specific party table (polymorphic relation)';
COMMENT ON COLUMN representantes.numero_processo IS 'Process number this representation is for';
COMMENT ON COLUMN representantes.polo IS 'Procedural pole: ativo, passivo, outros';
COMMENT ON COLUMN representantes.tipo_pessoa IS 'Person type: pf (pessoa física) or pj (pessoa jurídica)';
COMMENT ON COLUMN representantes.nome IS 'Full name or corporate name';
COMMENT ON COLUMN representantes.numero_oab IS 'OAB registration number (e.g., "MG128404")';
COMMENT ON COLUMN representantes.situacao_oab IS 'OAB status: REGULAR, SUSPENSO, CANCELADO, LICENCIADO, FALECIDO';
COMMENT ON COLUMN representantes.tipo IS 'Lawyer type: ADVOGADO, PROCURADOR, DEFENSOR_PUBLICO, etc.';
COMMENT ON COLUMN representantes.emails IS 'Array of email addresses';
COMMENT ON COLUMN representantes.cpf IS 'CPF for PF (11 digits)';
COMMENT ON COLUMN representantes.cnpj IS 'CNPJ for PJ (14 digits)';
COMMENT ON COLUMN representantes.dados_pje_completo IS 'Full PJE API response in JSONB format';
COMMENT ON COLUMN representantes.ordem IS 'Display order within party';
COMMENT ON COLUMN representantes.data_habilitacao IS 'Date when registered in PJE';
COMMENT ON COLUMN representantes.principal IS 'Indicates if this is the main representative for the party';

-- Create performance indexes
CREATE INDEX idx_representantes_id_pessoa_pje ON representantes(id_pessoa_pje);
CREATE INDEX idx_representantes_trt_grau ON representantes(trt, grau);
CREATE INDEX idx_representantes_parte ON representantes(parte_tipo, parte_id);
CREATE INDEX idx_representantes_numero_oab ON representantes(numero_oab) WHERE numero_oab IS NOT NULL;
CREATE INDEX idx_representantes_numero_processo ON representantes(numero_processo);
CREATE INDEX idx_representantes_situacao_oab ON representantes(situacao_oab) WHERE situacao_oab IS NOT NULL;

-- Create trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_representantes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_representantes_updated_at
  BEFORE UPDATE ON representantes
  FOR EACH ROW
  EXECUTE FUNCTION update_representantes_updated_at();
