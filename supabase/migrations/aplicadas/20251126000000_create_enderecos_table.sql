-- Migration: Criar tabela enderecos
-- Data: 2025-11-26
-- Descrição: Cria a tabela enderecos para armazenar endereços normalizados
--            de clientes, partes contrárias, terceiros e representantes.
--            Substitui armazenamento em JSONB por estrutura relacional.
--
-- Dependências: Deve ser executada ANTES de 20251124000000_add_endereco_id_to_partes.sql
--               (renomear aquela para 20251126000001_add_endereco_id_to_partes.sql)

-- ============================================================================
-- 1. Criar tipos ENUM
-- ============================================================================

-- Tipo de entidade proprietária do endereço (relação polimórfica)
CREATE TYPE entidade_tipo_endereco AS ENUM ('cliente', 'parte_contraria', 'terceiro');

-- Grau do processo
CREATE TYPE grau_endereco AS ENUM ('primeiro_grau', 'segundo_grau');

-- Situação do endereço no PJE
CREATE TYPE situacao_endereco AS ENUM ('A', 'I', 'P', 'H');

-- ============================================================================
-- 2. Criar tabela enderecos
-- ============================================================================

CREATE TABLE enderecos (
  -- Chave primária
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- Chave de deduplicação (única por ID PJE + entidade)
  id_pje BIGINT,
  entidade_tipo entidade_tipo_endereco NOT NULL,
  entidade_id BIGINT NOT NULL,

  -- Contexto do processo
  trt TEXT,
  grau grau_endereco,
  numero_processo TEXT,

  -- Campos de endereço
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cep TEXT,

  -- Município
  id_municipio_pje BIGINT,
  municipio TEXT,
  municipio_ibge TEXT,

  -- Estado
  estado_id_pje BIGINT,
  estado_sigla TEXT CHECK (char_length(estado_sigla) = 2), -- 2 caracteres (UF)
  estado_descricao TEXT, -- Descrição do estado no PJE
  estado TEXT, -- Nome completo do estado

  -- País
  pais_id_pje BIGINT,
  pais_codigo TEXT,
  pais_descricao TEXT, -- Descrição do país no PJE
  pais TEXT, -- Nome completo do país

  -- Metadados
  classificacoes_endereco JSONB, -- Array de {codigo, descricao}
  correspondencia BOOLEAN, -- Flag para endereço de correspondência
  situacao situacao_endereco, -- Situação no PJE

  -- Auditoria
  dados_pje_completo JSONB, -- JSON completo do endereço PJE (auditoria)
  id_usuario_cadastrador_pje BIGINT, -- Usuário que cadastrou no PJE
  data_alteracao_pje TIMESTAMPTZ, -- Data da última alteração no PJE

  -- Controle
  ativo BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Comentários da tabela
COMMENT ON TABLE enderecos IS 'Tabela de endereços normalizados para entidades (clientes, partes contrárias, terceiros). Substitui armazenamento em JSONB por estrutura relacional com deduplicação por ID PJE.';

-- Comentários das colunas
COMMENT ON COLUMN enderecos.id IS 'Chave primária gerada automaticamente';
COMMENT ON COLUMN enderecos.id_pje IS 'ID do endereço no sistema PJE (para deduplicação)';
COMMENT ON COLUMN enderecos.entidade_tipo IS 'Tipo da entidade dona do endereço (cliente, parte_contraria, terceiro)';
COMMENT ON COLUMN enderecos.entidade_id IS 'ID da entidade na tabela correspondente (clientes.id, partes_contrarias.id, terceiros.id)';
COMMENT ON COLUMN enderecos.trt IS 'Tribunal Regional do Trabalho (contexto do processo)';
COMMENT ON COLUMN enderecos.grau IS 'Grau do processo (primeiro_grau, segundo_grau)';
COMMENT ON COLUMN enderecos.numero_processo IS 'Número do processo (contexto do processo)';
COMMENT ON COLUMN enderecos.logradouro IS 'Logradouro do endereço';
COMMENT ON COLUMN enderecos.numero IS 'Número do endereço';
COMMENT ON COLUMN enderecos.complemento IS 'Complemento do endereço';
COMMENT ON COLUMN enderecos.bairro IS 'Bairro do endereço';
COMMENT ON COLUMN enderecos.cep IS 'CEP do endereço';
COMMENT ON COLUMN enderecos.id_municipio_pje IS 'ID do município no PJE';
COMMENT ON COLUMN enderecos.municipio IS 'Nome do município';
COMMENT ON COLUMN enderecos.municipio_ibge IS 'Código IBGE do município';
COMMENT ON COLUMN enderecos.estado_id_pje IS 'ID do estado no PJE';
COMMENT ON COLUMN enderecos.estado_sigla IS 'Sigla do estado (2 caracteres, ex: SP)';
COMMENT ON COLUMN enderecos.estado_descricao IS 'Descrição do estado no PJE';
COMMENT ON COLUMN enderecos.estado IS 'Nome completo do estado (ex: São Paulo)';
COMMENT ON COLUMN enderecos.pais_id_pje IS 'ID do país no PJE';
COMMENT ON COLUMN enderecos.pais_codigo IS 'Código do país';
COMMENT ON COLUMN enderecos.pais_descricao IS 'Descrição do país no PJE';
COMMENT ON COLUMN enderecos.pais IS 'Nome completo do país (ex: Brasil)';
COMMENT ON COLUMN enderecos.classificacoes_endereco IS 'Classificações do endereço no PJE (array JSONB de {codigo, descricao})';
COMMENT ON COLUMN enderecos.correspondencia IS 'Flag indicando se é endereço de correspondência';
COMMENT ON COLUMN enderecos.situacao IS 'Situação do endereço no PJE (A=Ativo, I=Inativo, P=Principal, H=Histórico)';
COMMENT ON COLUMN enderecos.dados_pje_completo IS 'JSON completo do endereço capturado do PJE (auditoria)';
COMMENT ON COLUMN enderecos.id_usuario_cadastrador_pje IS 'ID do usuário que cadastrou o endereço no PJE';
COMMENT ON COLUMN enderecos.data_alteracao_pje IS 'Data da última alteração do endereço no PJE';
COMMENT ON COLUMN enderecos.ativo IS 'Flag de ativo/inativo (soft delete)';
COMMENT ON COLUMN enderecos.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN enderecos.updated_at IS 'Data da última atualização do registro';

-- ============================================================================
-- 3. Constraints
-- ============================================================================

-- UNIQUE constraint para deduplicação por ID PJE + entidade
ALTER TABLE enderecos
ADD CONSTRAINT enderecos_unique_pje_entidade
UNIQUE (id_pje, entidade_tipo, entidade_id);

-- ============================================================================
-- 4. Índices
-- ============================================================================

-- Índice para UNIQUE constraint (já criado automaticamente, mas nomeamos explicitamente)
CREATE UNIQUE INDEX idx_enderecos_unique_pje ON enderecos(id_pje, entidade_tipo, entidade_id);

-- Índice para buscas por entidade
CREATE INDEX idx_enderecos_entidade ON enderecos(entidade_tipo, entidade_id);

-- Índice para buscas por processo
CREATE INDEX idx_enderecos_processo ON enderecos(trt, grau, numero_processo);

-- Índice parcial para endereços de correspondência
CREATE INDEX idx_enderecos_correspondencia ON enderecos(correspondencia) WHERE correspondencia = TRUE;

-- Índice parcial para endereços principais
CREATE INDEX idx_enderecos_situacao ON enderecos(situacao) WHERE situacao = 'P';

-- Índice GIN para busca em classificações (JSONB)
CREATE INDEX idx_enderecos_classificacoes ON enderecos USING GIN (classificacoes_endereco);

-- ============================================================================
-- 5. Trigger para updated_at
-- ============================================================================

-- Função para atualizar updated_at (se não existir, criar)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger na tabela enderecos
CREATE TRIGGER update_enderecos_updated_at
  BEFORE UPDATE ON enderecos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. Row Level Security (RLS)
-- ============================================================================

-- Habilitar RLS
ALTER TABLE enderecos ENABLE ROW LEVEL SECURITY;

-- Nota: Políticas RLS serão definidas em migration separada
-- (ex: apenas usuários autenticados podem ver endereços de suas entidades)