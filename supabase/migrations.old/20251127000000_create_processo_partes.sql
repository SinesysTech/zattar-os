-- Migration: Create processo_partes table
-- This table represents the N:N relationship between processes (acervo) and entities (clients, opposing parties, third parties)
-- Each record represents a unique participation of an entity in a specific process and degree

CREATE TABLE public.processo_partes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  
  -- Foreign key to the process (acervo table)
  processo_id bigint NOT NULL REFERENCES public.acervo(id) ON DELETE CASCADE,
  
  -- Type of participating entity (polymorphic FK)
  tipo_entidade text NOT NULL CHECK (tipo_entidade IN ('cliente', 'parte_contraria', 'terceiro')),
  
  -- ID of the entity in the corresponding table (polymorphic FK, no direct constraint)
  entidade_id bigint NOT NULL,
  
  -- ID of the party in PJE (mandatory, from PJE)
  id_pje bigint NOT NULL,
  
  -- ID of the person in PJE (optional, for PJE auditing)
  id_pessoa_pje bigint NULL,
  
  -- ID of the party type in PJE (optional, from PJE)
  id_tipo_parte bigint NULL,
  
  -- Type of participant in the process (from PJE, must be one of the valid types)
  tipo_parte text NOT NULL CHECK (tipo_parte IN ('AUTOR', 'REU', 'RECLAMANTE', 'RECLAMADO', 'EXEQUENTE', 'EXECUTADO', 'EMBARGANTE', 'EMBARGADO', 'APELANTE', 'APELADO', 'AGRAVANTE', 'AGRAVADO', 'PERITO', 'MINISTERIO_PUBLICO', 'ASSISTENTE', 'TESTEMUNHA', 'CUSTOS_LEGIS', 'AMICUS_CURIAE', 'OUTRO')),
  
  -- Procedural pole (from PJE mapping)
  polo text NOT NULL CHECK (polo IN ('ATIVO', 'PASSIVO', 'NEUTRO', 'TERCEIRO')),
  
  -- TRT code (from process data)
  trt text NOT NULL,
  
  -- Degree of the process (first or second degree)
  grau text NOT NULL CHECK (grau IN ('primeiro_grau', 'segundo_grau')),
  
  -- Process number (from process data)
  numero_processo text NOT NULL,
  
  -- Indicates if it's the main party in the pole (mandatory, from PJE)
  principal boolean NOT NULL,

  -- Display order within the pole (0-based, mandatory, must be >= 0)
  ordem integer NOT NULL CHECK (ordem >= 0),
  
  -- Status in PJE (optional, from PJE)
  status_pje text NULL,
  
  -- Situation in PJE (optional, from PJE)
  situacao_pje text NULL,
  
  -- Indicates if it's an authority (optional, from PJE)
  autoridade boolean NULL,
  
  -- Indicates if address is unknown (optional, from PJE)
  endereco_desconhecido boolean NULL,
  
  -- Complete JSON from PJE for auditing and history (optional, from PJE)
  dados_pje_completo jsonb NULL,
  
  -- Last update timestamp from PJE (optional, from PJE)
  ultima_atualizacao_pje timestamptz NULL,
  
  -- Timestamps (internal)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table comment
COMMENT ON TABLE public.processo_partes IS 'N:N relationship table between processes (acervo) and entities (clients/opposing parties/third parties). Each record represents a unique participation in a process-degree combination.';

-- Column comments
COMMENT ON COLUMN public.processo_partes.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN public.processo_partes.processo_id IS 'Foreign key to acervo.id (process), cascades on delete';
COMMENT ON COLUMN public.processo_partes.tipo_entidade IS 'Type of participating entity: cliente, parte_contraria, or terceiro (determines which table to join)';
COMMENT ON COLUMN public.processo_partes.entidade_id IS 'ID of the entity in the corresponding table (polymorphic FK, no direct constraint)';
COMMENT ON COLUMN public.processo_partes.id_pje IS 'ID of the party in PJE (idParte, mandatory, from PJE)';
COMMENT ON COLUMN public.processo_partes.id_pessoa_pje IS 'ID of the person in PJE (idPessoa, optional, for PJE auditing)';
COMMENT ON COLUMN public.processo_partes.id_tipo_parte IS 'ID of the party type in PJE (optional, from PJE)';
COMMENT ON COLUMN public.processo_partes.tipo_parte IS 'Type of participant in the process (e.g., RECLAMANTE, RECLAMADO, from PJE)';
COMMENT ON COLUMN public.processo_partes.polo IS 'Procedural pole: ATIVO (plaintiff), PASSIVO (defendant), NEUTRO (expert), TERCEIRO (intervening party, from PJE mapping)';
COMMENT ON COLUMN public.processo_partes.trt IS 'TRT code (from process data)';
COMMENT ON COLUMN public.processo_partes.grau IS 'Degree of the process: primeiro_grau or segundo_grau (from process data)';
COMMENT ON COLUMN public.processo_partes.numero_processo IS 'Process number (from process data)';
COMMENT ON COLUMN public.processo_partes.principal IS 'Indicates if it is the main party in the pole (mandatory, from PJE)';
COMMENT ON COLUMN public.processo_partes.ordem IS 'Display order within the pole (0-based, mandatory, must be >= 0)';
COMMENT ON COLUMN public.processo_partes.status_pje IS 'Status in PJE (optional, from PJE)';
COMMENT ON COLUMN public.processo_partes.situacao_pje IS 'Situation in PJE (optional, from PJE)';
COMMENT ON COLUMN public.processo_partes.autoridade IS 'Indicates if it is an authority (optional, from PJE)';
COMMENT ON COLUMN public.processo_partes.endereco_desconhecido IS 'Indicates if address is unknown (optional, from PJE)';
COMMENT ON COLUMN public.processo_partes.dados_pje_completo IS 'Complete JSON from PJE for auditing and history (optional, from PJE)';
COMMENT ON COLUMN public.processo_partes.ultima_atualizacao_pje IS 'Last update timestamp from PJE (optional, from PJE)';
COMMENT ON COLUMN public.processo_partes.created_at IS 'Record creation timestamp (internal)';
COMMENT ON COLUMN public.processo_partes.updated_at IS 'Record last update timestamp (internal, auto-updated)';

-- Unique constraint to prevent duplicates of the same entity in the same process-degree
ALTER TABLE public.processo_partes ADD CONSTRAINT unique_processo_entidade_grau UNIQUE (processo_id, tipo_entidade, entidade_id, grau);

-- Indexes for performance
CREATE INDEX idx_processo_partes_processo_id ON public.processo_partes USING btree (processo_id);
CREATE INDEX idx_processo_partes_entidade ON public.processo_partes USING btree (tipo_entidade, entidade_id);
CREATE INDEX idx_processo_partes_polo ON public.processo_partes USING btree (polo);
CREATE INDEX idx_processo_partes_trt_grau ON public.processo_partes USING btree (trt, grau);
CREATE INDEX idx_processo_partes_numero_processo ON public.processo_partes USING btree (numero_processo);
CREATE INDEX idx_processo_partes_id_pessoa_pje ON public.processo_partes USING btree (id_pessoa_pje) WHERE id_pessoa_pje IS NOT NULL;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_processo_partes_updated_at
BEFORE UPDATE ON public.processo_partes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.processo_partes ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (authenticated users can perform operations, permissions handled elsewhere)
CREATE POLICY "Authenticated users can select processo_partes" ON public.processo_partes
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert processo_partes" ON public.processo_partes
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update processo_partes" ON public.processo_partes
FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete processo_partes" ON public.processo_partes
FOR DELETE USING (auth.uid() IS NOT NULL);