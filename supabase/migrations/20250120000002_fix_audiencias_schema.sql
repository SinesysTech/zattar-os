-- Migration: Corrigir schema de audiências
-- 
-- Correções:
-- 1. Criar enum para status_audiencia
-- 2. Popular campo status_descricao baseado em status
-- 3. Remover campos desnecessários: polo_ativo_cpf, polo_passivo_cnpj, hora_inicial, hora_final
-- 4. Garantir que campos observacoes e dados_anteriores existam

-- ============================================================================
-- 1. CRIAR ENUM PARA STATUS DE AUDIÊNCIA
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_audiencia') THEN
    CREATE TYPE public.status_audiencia AS ENUM (
      'C',  -- Cancelada
      'M',  -- Designada (Marcada)
      'F'   -- Realizada (Finalizada)
    );
    
    COMMENT ON TYPE public.status_audiencia IS 
    'Status da audiência: C=Cancelada, M=Designada, F=Realizada';
  END IF;
END $$;

-- ============================================================================
-- 2. ADICIONAR CAMPOS FALTANTES (SE NÃO EXISTIREM)
-- ============================================================================

-- Adicionar coluna observacoes se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'audiencias' 
      AND column_name = 'observacoes'
  ) THEN
    ALTER TABLE public.audiencias ADD COLUMN observacoes text;
    COMMENT ON COLUMN public.audiencias.observacoes IS 'Observações sobre a audiência';
  END IF;
END $$;

-- Adicionar coluna dados_anteriores se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'audiencias' 
      AND column_name = 'dados_anteriores'
  ) THEN
    ALTER TABLE public.audiencias ADD COLUMN dados_anteriores jsonb;
    COMMENT ON COLUMN public.audiencias.dados_anteriores IS 
    'Armazena o estado anterior do registro antes da última atualização. Null quando o registro foi inserido ou quando não houve mudanças na última captura.';
  END IF;
END $$;

-- ============================================================================
-- 3. POPULAR CAMPO status_descricao BASEADO NO CÓDIGO
-- ============================================================================

-- Criar tabela temporária de mapeamento
CREATE TEMP TABLE status_mapping (
  codigo text PRIMARY KEY,
  descricao text NOT NULL
);

INSERT INTO status_mapping (codigo, descricao) VALUES
  ('C', 'Cancelada'),
  ('M', 'Designada'),
  ('F', 'Realizada');

-- Atualizar status_descricao para registros existentes onde está NULL ou vazio
UPDATE public.audiencias a
SET status_descricao = m.descricao
FROM status_mapping m
WHERE a.status = m.codigo
  AND (a.status_descricao IS NULL OR a.status_descricao = '');

-- Log de quantos registros foram atualizados
DO $$
DECLARE
  updated_count integer;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Atualizados % registros de audiências com status_descricao', updated_count;
END $$;

-- Limpar tabela temporária
DROP TABLE status_mapping;

-- ============================================================================
-- 4. REMOVER CAMPOS DESNECESSÁRIOS
-- ============================================================================

-- Remover polo_ativo_cpf (campo criado por engano, nunca usado, sempre NULL)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'audiencias' 
      AND column_name = 'polo_ativo_cpf'
  ) THEN
    ALTER TABLE public.audiencias DROP COLUMN IF EXISTS polo_ativo_cpf;
    RAISE NOTICE 'Campo polo_ativo_cpf removido (não utilizado)';
  END IF;
END $$;

-- Remover polo_passivo_cnpj (campo criado por engano, nunca usado, sempre NULL)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'audiencias' 
      AND column_name = 'polo_passivo_cnpj'
  ) THEN
    ALTER TABLE public.audiencias DROP COLUMN IF EXISTS polo_passivo_cnpj;
    RAISE NOTICE 'Campo polo_passivo_cnpj removido (não utilizado)';
  END IF;
END $$;

-- Remover hora_inicial (redundante com data_inicio)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'audiencias' 
      AND column_name = 'hora_inicial'
  ) THEN
    ALTER TABLE public.audiencias DROP COLUMN IF EXISTS hora_inicial;
    RAISE NOTICE 'Campo hora_inicial removido (redundante com data_inicio)';
  END IF;
END $$;

-- Remover hora_final (redundante com data_fim)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'audiencias' 
      AND column_name = 'hora_final'
  ) THEN
    ALTER TABLE public.audiencias DROP COLUMN IF EXISTS hora_final;
    RAISE NOTICE 'Campo hora_final removido (redundante com data_fim)';
  END IF;
END $$;

-- ============================================================================
-- 5. REMOVER ÍNDICES DOS CAMPOS REMOVIDOS
-- ============================================================================

-- Não há índices específicos para esses campos, mas verificamos por garantia
DROP INDEX IF EXISTS public.idx_audiencias_hora_inicial;
DROP INDEX IF EXISTS public.idx_audiencias_hora_final;
DROP INDEX IF EXISTS public.idx_audiencias_polo_ativo_cpf;
DROP INDEX IF EXISTS public.idx_audiencias_polo_passivo_cnpj;

-- ============================================================================
-- 6. CONVERTER TIPO DA COLUNA STATUS PARA ENUM (OPCIONAL - COMENTADO)
-- ============================================================================

-- AVISO: Esta conversão pode falhar se houver valores não mapeados
-- Descomente apenas se tiver certeza que todos os valores são C, M ou F

/*
DO $$
BEGIN
  -- Verificar se todos os valores de status são válidos
  IF NOT EXISTS (
    SELECT 1 FROM public.audiencias 
    WHERE status NOT IN ('C', 'M', 'F')
  ) THEN
    -- Alterar tipo da coluna para enum
    ALTER TABLE public.audiencias 
      ALTER COLUMN status TYPE public.status_audiencia 
      USING status::public.status_audiencia;
    
    COMMENT ON COLUMN public.audiencias.status IS 
    'Status da audiência (C=Cancelada, M=Designada, F=Realizada)';
    
    RAISE NOTICE 'Coluna status convertida para tipo enum status_audiencia';
  ELSE
    RAISE NOTICE 'Existem valores de status não mapeados. Conversão para enum não realizada.';
  END IF;
END $$;
*/

-- ============================================================================
-- 7. ATUALIZAR COMENTÁRIO DA TABELA
-- ============================================================================

COMMENT ON TABLE public.audiencias IS 
'Audiências agendadas dos processos capturados do PJE. A unicidade da audiência é garantida por (id_pje, trt, grau, numero_processo), permitindo que múltiplos advogados vejam a mesma audiência do mesmo processo sem duplicação. Campos polo_ativo_cpf, polo_passivo_cnpj, hora_inicial e hora_final foram removidos por serem desnecessários.';

COMMENT ON COLUMN public.audiencias.status IS 
'Status da audiência (C=Cancelada, M=Designada, F=Realizada)';

COMMENT ON COLUMN public.audiencias.status_descricao IS 
'Descrição do status da audiência (populada automaticamente via trigger ou migration)';

-- ============================================================================
-- 8. CRIAR TRIGGER PARA POPULAR status_descricao AUTOMATICAMENTE
-- ============================================================================

-- Função para popular status_descricao
CREATE OR REPLACE FUNCTION public.populate_audiencia_status_descricao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Popular status_descricao baseado no código
  CASE NEW.status
    WHEN 'C' THEN NEW.status_descricao := 'Cancelada';
    WHEN 'M' THEN NEW.status_descricao := 'Designada';
    WHEN 'F' THEN NEW.status_descricao := 'Realizada';
    ELSE NEW.status_descricao := NULL;
  END CASE;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.populate_audiencia_status_descricao() IS
'Trigger function para popular automaticamente status_descricao baseado no código de status';

-- Criar trigger BEFORE INSERT OR UPDATE
DROP TRIGGER IF EXISTS trigger_populate_audiencia_status ON public.audiencias;

CREATE TRIGGER trigger_populate_audiencia_status
  BEFORE INSERT OR UPDATE OF status
  ON public.audiencias
  FOR EACH ROW
  WHEN (NEW.status IS NOT NULL)
  EXECUTE FUNCTION public.populate_audiencia_status_descricao();

COMMENT ON TRIGGER trigger_populate_audiencia_status ON public.audiencias IS
'Popula automaticamente status_descricao quando status é inserido ou atualizado';

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

-- Verificar estrutura final da tabela
DO $$
DECLARE
  col_count integer;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = 'audiencias';
  
  RAISE NOTICE 'Tabela audiencias possui % colunas após migration', col_count;
END $$;

-- Verificar se há registros com status_descricao NULL
DO $$
DECLARE
  null_count integer;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM public.audiencias
  WHERE status_descricao IS NULL AND status IS NOT NULL;
  
  IF null_count > 0 THEN
    RAISE WARNING '% registros ainda possuem status_descricao NULL', null_count;
  ELSE
    RAISE NOTICE 'Todos os registros possuem status_descricao populado';
  END IF;
END $$;
