/**
 * Tipos de domínio financeiro
 * Re-exporta tipos do módulo financeiro para compatibilidade de imports
 */

export type {
  PlanoContas,
  PlanoContaComPai,
  PlanoContaHierarquico,
  TipoContaContabil as TipoPlanoContas,
  TipoContaContabil as TipoConta,
  NaturezaConta,
  NivelConta,
  ListarPlanoContasParams,
  ListarPlanoContasResponse,
  CriarPlanoContaDTO as CriarPlanoContasDTO,
  AtualizarPlanoContaDTO as AtualizarPlanoContasDTO,
  PlanoConta,
} from '@/features/financeiro/domain/plano-contas';
