/**
 * Types de domínio para o módulo Financeiro
 * Re-exporta tipos do backend para uso no frontend
 */

export type {
  TipoContaContabil,
  NaturezaConta,
  NivelConta,
  PlanoConta,
  PlanoContaComPai,
  PlanoContaHierarquico,
  ContaPaiResumo,
  CriarPlanoContaDTO,
  AtualizarPlanoContaDTO,
  ListarPlanoContasParams,
  ListarPlanoContasResponse,
  OperacaoPlanoContaResult,
  PlanoContasFilters,
} from '@/backend/types/financeiro/plano-contas.types';

export {
  isPlanoConta,
  validarCriarPlanoContaDTO,
  validarAtualizarPlanoContaDTO,
  getNaturezaPadrao,
  TIPO_CONTA_LABELS,
  NATUREZA_LABELS,
  NIVEL_LABELS,
} from '@/backend/types/financeiro/plano-contas.types';
