-- Migration Etapa 1: Criar novas tabelas normalizadas para audiências
-- Data: 2025-11-19
-- Descrição: Cria tabelas classe_judicial, tipo_audiencia e sala_audiencia
--            para normalizar dados do PJE e manter consistência

-- =============================================================================
-- TABELA: classe_judicial
-- Armazena classes judiciais (ações trabalhistas, recursos, etc) por TRT e grau
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.classe_judicial (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_pje bigint NOT NULL,
  trt public.codigo_tribunal NOT NULL,
  grau public.grau_tribunal NOT NULL,
  codigo text NOT NULL,
  descricao text NOT NULL,
  sigla text,
  requer_processo_referencia_codigo text,
  controla_valor_causa boolean DEFAULT false NOT NULL,
  pode_incluir_autoridade boolean DEFAULT false NOT NULL,
  piso_valor_causa numeric(15,2),
  teto_valor_causa numeric(15,2),
  ativo boolean DEFAULT true NOT NULL,
  id_classe_judicial_pai bigint,
  possui_filhos boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  -- Garantir unicidade por ID do PJE, TRT e grau
  UNIQUE (id_pje, trt, grau)
);

COMMENT ON TABLE public.classe_judicial IS 'Classes judiciais do PJE por TRT e grau (ex: Ação Trabalhista - Rito Ordinário, Ação Trabalhista - Rito Sumaríssimo)';
COMMENT ON COLUMN public.classe_judicial.id_pje IS 'ID da classe judicial no sistema PJE';
COMMENT ON COLUMN public.classe_judicial.trt IS 'Código do TRT';
COMMENT ON COLUMN public.classe_judicial.grau IS 'Grau (primeiro_grau ou segundo_grau)';
COMMENT ON COLUMN public.classe_judicial.codigo IS 'Código numérico da classe judicial no PJE';
COMMENT ON COLUMN public.classe_judicial.descricao IS 'Descrição completa da classe judicial';
COMMENT ON COLUMN public.classe_judicial.sigla IS 'Sigla da classe judicial (ex: ATOrd, ATSum, RO)';
COMMENT ON COLUMN public.classe_judicial.requer_processo_referencia_codigo IS 'Código indicando se requer processo de referência';
COMMENT ON COLUMN public.classe_judicial.controla_valor_causa IS 'Indica se controla valor da causa';
COMMENT ON COLUMN public.classe_judicial.pode_incluir_autoridade IS 'Indica se pode incluir autoridade';
COMMENT ON COLUMN public.classe_judicial.piso_valor_causa IS 'Valor mínimo da causa para esta classe';
COMMENT ON COLUMN public.classe_judicial.teto_valor_causa IS 'Valor máximo da causa para esta classe';
COMMENT ON COLUMN public.classe_judicial.ativo IS 'Indica se a classe judicial está ativa';
COMMENT ON COLUMN public.classe_judicial.id_classe_judicial_pai IS 'ID da classe judicial pai (para classes hierárquicas)';
COMMENT ON COLUMN public.classe_judicial.possui_filhos IS 'Indica se possui classes judiciais filhas';

-- Índices para performance
CREATE INDEX idx_classe_judicial_id_pje ON public.classe_judicial(id_pje);
CREATE INDEX idx_classe_judicial_trt_grau ON public.classe_judicial(trt, grau);
CREATE INDEX idx_classe_judicial_codigo ON public.classe_judicial(codigo);
CREATE INDEX idx_classe_judicial_sigla ON public.classe_judicial(sigla);
CREATE INDEX idx_classe_judicial_ativo ON public.classe_judicial(ativo);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_classe_judicial_updated_at
  BEFORE UPDATE ON public.classe_judicial
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.classe_judicial ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- TABELA: tipo_audiencia
-- Armazena tipos de audiência (Una, Instrução, etc) por TRT e grau
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.tipo_audiencia (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_pje bigint NOT NULL,
  trt public.codigo_tribunal NOT NULL,
  grau public.grau_tribunal NOT NULL,
  codigo text NOT NULL,
  descricao text NOT NULL,
  is_virtual boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  -- Garantir unicidade por ID do PJE, TRT e grau
  UNIQUE (id_pje, trt, grau)
);

COMMENT ON TABLE public.tipo_audiencia IS 'Tipos de audiência do PJE por TRT e grau (ex: Una, Instrução, Julgamento)';
COMMENT ON COLUMN public.tipo_audiencia.id_pje IS 'ID do tipo de audiência no sistema PJE';
COMMENT ON COLUMN public.tipo_audiencia.trt IS 'Código do TRT';
COMMENT ON COLUMN public.tipo_audiencia.grau IS 'Grau (primeiro_grau ou segundo_grau)';
COMMENT ON COLUMN public.tipo_audiencia.codigo IS 'Código numérico do tipo de audiência no PJE';
COMMENT ON COLUMN public.tipo_audiencia.descricao IS 'Descrição do tipo de audiência';
COMMENT ON COLUMN public.tipo_audiencia.is_virtual IS 'Indica se a audiência é realizada virtualmente';

-- Índices para performance
CREATE INDEX idx_tipo_audiencia_id_pje ON public.tipo_audiencia(id_pje);
CREATE INDEX idx_tipo_audiencia_trt_grau ON public.tipo_audiencia(trt, grau);
CREATE INDEX idx_tipo_audiencia_codigo ON public.tipo_audiencia(codigo);
CREATE INDEX idx_tipo_audiencia_is_virtual ON public.tipo_audiencia(is_virtual);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_tipo_audiencia_updated_at
  BEFORE UPDATE ON public.tipo_audiencia
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.tipo_audiencia ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- TABELA: sala_audiencia
-- Armazena salas de audiência por TRT, grau e órgão julgador
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.sala_audiencia (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_pje bigint,
  trt public.codigo_tribunal NOT NULL,
  grau public.grau_tribunal NOT NULL,
  orgao_julgador_id bigint NOT NULL REFERENCES public.orgao_julgador(id) ON DELETE CASCADE,
  nome text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  -- Garantir unicidade por nome, TRT, grau e órgão julgador
  -- Nota: id_pje pode ser NULL pois nem sempre vem do PJE
  UNIQUE (nome, trt, grau, orgao_julgador_id)
);

COMMENT ON TABLE public.sala_audiencia IS 'Salas de audiência do PJE por TRT, grau e órgão julgador';
COMMENT ON COLUMN public.sala_audiencia.id_pje IS 'ID da sala no sistema PJE (pode ser NULL se não fornecido)';
COMMENT ON COLUMN public.sala_audiencia.trt IS 'Código do TRT';
COMMENT ON COLUMN public.sala_audiencia.grau IS 'Grau (primeiro_grau ou segundo_grau)';
COMMENT ON COLUMN public.sala_audiencia.orgao_julgador_id IS 'Referência ao órgão julgador onde a sala está localizada';
COMMENT ON COLUMN public.sala_audiencia.nome IS 'Nome da sala de audiência';

-- Índices para performance
CREATE INDEX idx_sala_audiencia_id_pje ON public.sala_audiencia(id_pje) WHERE id_pje IS NOT NULL;
CREATE INDEX idx_sala_audiencia_trt_grau ON public.sala_audiencia(trt, grau);
CREATE INDEX idx_sala_audiencia_orgao_julgador_id ON public.sala_audiencia(orgao_julgador_id);
CREATE INDEX idx_sala_audiencia_nome ON public.sala_audiencia(nome);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_sala_audiencia_updated_at
  BEFORE UPDATE ON public.sala_audiencia
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.sala_audiencia ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- ADICIONAR COLUNAS EM TABELAS EXISTENTES
-- =============================================================================

-- Adicionar FK classe_judicial_id em acervo (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'acervo' 
    AND column_name = 'classe_judicial_id'
  ) THEN
    ALTER TABLE public.acervo ADD COLUMN classe_judicial_id bigint REFERENCES public.classe_judicial(id) ON DELETE SET NULL;
    CREATE INDEX idx_acervo_classe_judicial_id ON public.acervo(classe_judicial_id);
    COMMENT ON COLUMN public.acervo.classe_judicial_id IS 'Referência à classe judicial normalizada';
  END IF;
END $$;

-- Adicionar colunas em audiencias
DO $$
BEGIN
  -- FK classe_judicial_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'audiencias' 
    AND column_name = 'classe_judicial_id'
  ) THEN
    ALTER TABLE public.audiencias ADD COLUMN classe_judicial_id bigint REFERENCES public.classe_judicial(id) ON DELETE SET NULL;
    CREATE INDEX idx_audiencias_classe_judicial_id ON public.audiencias(classe_judicial_id);
    COMMENT ON COLUMN public.audiencias.classe_judicial_id IS 'Referência à classe judicial do processo';
  END IF;

  -- FK tipo_audiencia_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'audiencias' 
    AND column_name = 'tipo_audiencia_id'
  ) THEN
    ALTER TABLE public.audiencias ADD COLUMN tipo_audiencia_id bigint REFERENCES public.tipo_audiencia(id) ON DELETE SET NULL;
    CREATE INDEX idx_audiencias_tipo_audiencia_id ON public.audiencias(tipo_audiencia_id);
    COMMENT ON COLUMN public.audiencias.tipo_audiencia_id IS 'Referência ao tipo de audiência normalizado';
  END IF;

  -- FK sala_audiencia_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'audiencias' 
    AND column_name = 'sala_audiencia_id'
  ) THEN
    ALTER TABLE public.audiencias ADD COLUMN sala_audiencia_id bigint REFERENCES public.sala_audiencia(id) ON DELETE SET NULL;
    CREATE INDEX idx_audiencias_sala_audiencia_id ON public.audiencias(sala_audiencia_id);
    COMMENT ON COLUMN public.audiencias.sala_audiencia_id IS 'Referência à sala de audiência normalizada';
  END IF;

  -- Campos do processo
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'audiencias' 
    AND column_name = 'segredo_justica'
  ) THEN
    ALTER TABLE public.audiencias ADD COLUMN segredo_justica boolean DEFAULT false NOT NULL;
    COMMENT ON COLUMN public.audiencias.segredo_justica IS 'Indica se o processo está em segredo de justiça';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'audiencias' 
    AND column_name = 'juizo_digital'
  ) THEN
    ALTER TABLE public.audiencias ADD COLUMN juizo_digital boolean DEFAULT false NOT NULL;
    COMMENT ON COLUMN public.audiencias.juizo_digital IS 'Indica se o processo é de juízo digital';
  END IF;

  -- Campos de polo
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'audiencias' 
    AND column_name = 'polo_ativo_representa_varios'
  ) THEN
    ALTER TABLE public.audiencias ADD COLUMN polo_ativo_representa_varios boolean DEFAULT false NOT NULL;
    COMMENT ON COLUMN public.audiencias.polo_ativo_representa_varios IS 'Indica se o polo ativo representa vários autores';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'audiencias' 
    AND column_name = 'polo_passivo_representa_varios'
  ) THEN
    ALTER TABLE public.audiencias ADD COLUMN polo_passivo_representa_varios boolean DEFAULT false NOT NULL;
    COMMENT ON COLUMN public.audiencias.polo_passivo_representa_varios IS 'Indica se o polo passivo representa vários réus';
  END IF;

  -- Campo pauta_audiencia_horario_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'audiencias' 
    AND column_name = 'pauta_audiencia_horario_id'
  ) THEN
    ALTER TABLE public.audiencias ADD COLUMN pauta_audiencia_horario_id bigint;
    COMMENT ON COLUMN public.audiencias.pauta_audiencia_horario_id IS 'ID do horário na pauta de audiências do PJE';
  END IF;
END $$;
