-- Migration: Adicionar 'expedientes' ao CHECK constraint da tabela logs_alteracao
--
-- PROBLEMA: A tabela logs_alteracao tem um CHECK constraint que não inclui 'expedientes':
--   check (tipo_entidade in ('acervo', 'audiencias', 'pendentes_manifestacao', 'usuarios', 'advogados'))
--
-- A função registrar_baixa_expediente tenta inserir tipo_entidade = 'expedientes',
-- o que causa falha e erro 500 em produção quando um usuário tenta dar baixa em expediente.

-- ============================================================================
-- Remover o constraint antigo e adicionar o novo com 'expedientes'
-- ============================================================================

-- Primeiro, dropar o constraint existente
ALTER TABLE public.logs_alteracao
DROP CONSTRAINT IF EXISTS logs_alteracao_tipo_entidade_check;

-- Adicionar o novo constraint com 'expedientes' incluído
ALTER TABLE public.logs_alteracao
ADD CONSTRAINT logs_alteracao_tipo_entidade_check
CHECK (tipo_entidade IN (
  'acervo',
  'audiencias',
  'pendentes_manifestacao',
  'usuarios',
  'advogados',
  'expedientes',       -- ADICIONADO: Para baixa de expedientes
  'partes',            -- ADICIONADO: Para futuras alterações em partes
  'clientes',          -- ADICIONADO: Para futuras alterações em clientes
  'partes_contrarias', -- ADICIONADO: Para futuras alterações em partes contrárias
  'terceiros',         -- ADICIONADO: Para futuras alterações em terceiros
  'representantes'     -- ADICIONADO: Para futuras alterações em representantes
));

-- Atualizar o comentário da coluna
COMMENT ON COLUMN public.logs_alteracao.tipo_entidade IS
'Tipo da entidade que foi alterada. Valores permitidos: acervo, audiencias, pendentes_manifestacao, usuarios, advogados, expedientes, partes, clientes, partes_contrarias, terceiros, representantes';
