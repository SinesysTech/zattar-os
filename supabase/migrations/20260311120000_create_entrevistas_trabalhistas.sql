-- Migration: Entrevistas Trabalhistas
-- Cria enums, tabela principal e tabela de anexos para o módulo de entrevistas de investigação trabalhista

-- ============================================================================
-- Enums (safe create with DO block)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_litigio_trabalhista') THEN
    CREATE TYPE public.tipo_litigio_trabalhista AS ENUM (
      'trabalhista_classico',
      'gig_economy',
      'pejotizacao'
    );
    COMMENT ON TYPE public.tipo_litigio_trabalhista IS 'Tipo de litígio trabalhista: trabalhista_classico, gig_economy, pejotizacao';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_entrevista') THEN
    CREATE TYPE public.status_entrevista AS ENUM (
      'rascunho',
      'em_andamento',
      'concluida'
    );
    COMMENT ON TYPE public.status_entrevista IS 'Status da entrevista: rascunho, em_andamento, concluida';
  END IF;
END
$$;

-- ============================================================================
-- Tabela principal: entrevistas_trabalhistas
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.entrevistas_trabalhistas (
  id bigint generated always as identity primary key,

  -- Vínculo com contrato (1:1)
  contrato_id bigint not null references public.contratos(id) on delete cascade,

  -- Classificação do litígio (Nó Zero)
  tipo_litigio public.tipo_litigio_trabalhista not null,
  perfil_reclamante text,

  -- Status e progresso
  status public.status_entrevista not null default 'rascunho',
  modulo_atual text default 'no_zero',

  -- Dados da entrevista (JSONB flexível por trilha)
  respostas jsonb not null default '{}'::jsonb,
  notas_operador jsonb default '{}'::jsonb,

  -- Mapeamento de testemunhas
  testemunhas_mapeadas boolean not null default false,

  -- Auditoria
  created_by bigint references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

COMMENT ON TABLE public.entrevistas_trabalhistas IS 'Ficha de entrevista de investigação trabalhista vinculada ao contrato';
COMMENT ON COLUMN public.entrevistas_trabalhistas.contrato_id IS 'ID do contrato ao qual a entrevista está vinculada (relação 1:1)';
COMMENT ON COLUMN public.entrevistas_trabalhistas.tipo_litigio IS 'Tipo de litígio: trabalhista_classico, gig_economy ou pejotizacao';
COMMENT ON COLUMN public.entrevistas_trabalhistas.perfil_reclamante IS 'Perfil do reclamante: domestica, comerciario, industrial, rural, etc.';
COMMENT ON COLUMN public.entrevistas_trabalhistas.status IS 'Status da entrevista: rascunho, em_andamento ou concluida';
COMMENT ON COLUMN public.entrevistas_trabalhistas.modulo_atual IS 'Último módulo preenchido (para retomada)';
COMMENT ON COLUMN public.entrevistas_trabalhistas.respostas IS 'Respostas estruturadas por módulo em formato JSONB';
COMMENT ON COLUMN public.entrevistas_trabalhistas.notas_operador IS 'Anotações livres do entrevistador por módulo em JSONB';
COMMENT ON COLUMN public.entrevistas_trabalhistas.testemunhas_mapeadas IS 'Indica se testemunhas foram mapeadas durante a entrevista';
COMMENT ON COLUMN public.entrevistas_trabalhistas.created_by IS 'ID do usuário que conduziu a entrevista';

-- Constraint de unicidade: uma entrevista por contrato
ALTER TABLE public.entrevistas_trabalhistas
  ADD CONSTRAINT uq_entrevistas_trabalhistas_contrato_id UNIQUE (contrato_id);

-- Indexes
CREATE INDEX idx_entrevistas_trab_contrato_id ON public.entrevistas_trabalhistas USING btree (contrato_id);
CREATE INDEX idx_entrevistas_trab_status ON public.entrevistas_trabalhistas USING btree (status);
CREATE INDEX idx_entrevistas_trab_tipo_litigio ON public.entrevistas_trabalhistas USING btree (tipo_litigio);
CREATE INDEX idx_entrevistas_trab_created_by ON public.entrevistas_trabalhistas USING btree (created_by);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_entrevistas_trabalhistas_updated_at
BEFORE UPDATE ON public.entrevistas_trabalhistas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.entrevistas_trabalhistas ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "service role full access - entrevistas_trabalhistas"
  ON public.entrevistas_trabalhistas FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================================
-- Tabela de anexos: entrevista_anexos
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.entrevista_anexos (
  id bigint generated always as identity primary key,

  -- Vínculo com entrevista
  entrevista_id bigint not null references public.entrevistas_trabalhistas(id) on delete cascade,

  -- Contexto do anexo
  modulo text not null,
  no_referencia text,
  tipo_anexo text not null,

  -- Arquivo
  arquivo_url text not null,
  descricao text,

  -- Auditoria
  created_at timestamptz not null default now()
);

COMMENT ON TABLE public.entrevista_anexos IS 'Anexos probatórios da entrevista trabalhista, vinculados por módulo e nó';
COMMENT ON COLUMN public.entrevista_anexos.entrevista_id IS 'ID da entrevista à qual o anexo pertence';
COMMENT ON COLUMN public.entrevista_anexos.modulo IS 'Módulo da entrevista: vinculo, jornada, saude_ambiente, ruptura, etc.';
COMMENT ON COLUMN public.entrevista_anexos.no_referencia IS 'Nó de referência no fluxo: A.1.1, B.2.1, C.3.2, etc.';
COMMENT ON COLUMN public.entrevista_anexos.tipo_anexo IS 'Tipo do anexo: foto_ctps, print_whatsapp, audio_relato, trct, extrato_fgts, etc.';
COMMENT ON COLUMN public.entrevista_anexos.arquivo_url IS 'URL do arquivo no storage';
COMMENT ON COLUMN public.entrevista_anexos.descricao IS 'Descrição livre do anexo';

-- Indexes
CREATE INDEX idx_entrevista_anexos_entrevista_id ON public.entrevista_anexos USING btree (entrevista_id);
CREATE INDEX idx_entrevista_anexos_modulo ON public.entrevista_anexos USING btree (modulo);

-- Habilitar RLS
ALTER TABLE public.entrevista_anexos ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "service role full access - entrevista_anexos"
  ON public.entrevista_anexos FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);
