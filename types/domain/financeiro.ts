/**
 * Types de domínio para o módulo Financeiro
 * Re-exporta tipos do backend para uso no frontend
 */

// ============================================================================
// Plano de Contas
// ============================================================================

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

// ============================================================================
// Contas a Pagar
// ============================================================================

export type {
  StatusContaPagar,
  OrigemContaPagar,
  FormaPagamentoContaPagar,
  FrequenciaRecorrencia,
  CategoriaContaPagar,
  AnexoContaPagar,
  ContaPagar,
  ContaPagarComDetalhes,
  ContaPagarRecorrente,
  FornecedorResumo,
  ContaContabilResumo,
  CentroCustoResumo,
  ContaBancariaResumo,
  CriarContaPagarDTO,
  AtualizarContaPagarDTO,
  PagarContaPagarDTO,
  CancelarContaPagarDTO,
  ListarContasPagarParams,
  ListarContasPagarResponse,
  OperacaoContaPagarResult,
  GerarRecorrentesResult,
  ResumoVencimentos,
  ContasPagarFilters,
} from '@/backend/types/financeiro/contas-pagar.types';

export {
  isContaPagar,
  validarCriarContaPagarDTO,
  validarAtualizarContaPagarDTO,
  validarPagarContaPagarDTO,
  isOrigemValida,
  isFormaPagamentoValida,
  isFrequenciaValida,
  isStatusValido,
  STATUS_LABELS,
  ORIGEM_LABELS,
  FORMA_PAGAMENTO_LABELS,
  FREQUENCIA_LABELS,
  CATEGORIA_LABELS,
  calcularProximoVencimento,
  isContaVencida,
  isContaVenceHoje,
  diasAteVencimento,
} from '@/backend/types/financeiro/contas-pagar.types';

// ============================================================================
// Contas a Receber
// ============================================================================

export type {
  StatusContaReceber,
  OrigemContaReceber,
  FormaRecebimentoContaReceber,
  CategoriaContaReceber,
  AnexoContaReceber,
  ContaReceber,
  ContaReceberComDetalhes,
  ContaReceberRecorrente,
  ClienteResumo,
  ContratoResumo,
  CriarContaReceberDTO,
  AtualizarContaReceberDTO,
  ReceberContaReceberDTO,
  CancelarContaReceberDTO,
  ListarContasReceberParams,
  ListarContasReceberResponse,
  OperacaoContaReceberResult,
  ResumoInadimplencia,
  ContasReceberFilters,
} from '@/backend/types/financeiro/contas-receber.types';

export {
  isContaReceber,
  validarCriarContaReceberDTO,
  validarAtualizarContaReceberDTO,
  validarReceberContaReceberDTO,
  isOrigemValida as isOrigemContaReceberValida,
  isFormaRecebimentoValida,
  isFrequenciaValida as isFrequenciaContaReceberValida,
  isStatusValido as isStatusContaReceberValido,
  STATUS_LABELS as STATUS_CONTA_RECEBER_LABELS,
  ORIGEM_LABELS as ORIGEM_CONTA_RECEBER_LABELS,
  FORMA_RECEBIMENTO_LABELS,
  FREQUENCIA_LABELS as FREQUENCIA_CONTA_RECEBER_LABELS,
  CATEGORIA_LABELS as CATEGORIA_CONTA_RECEBER_LABELS,
  CATEGORIAS_PADRAO as CATEGORIAS_CONTA_RECEBER_PADRAO,
  calcularProximoVencimento as calcularProximoVencimentoContaReceber,
  isContaVencida as isContaReceberVencida,
  isContaVenceHoje as isContaReceberVenceHoje,
  diasAteVencimento as diasAteVencimentoContaReceber,
} from '@/backend/types/financeiro/contas-receber.types';

// Importa tipo para uso nas funções utilitárias
import type { PlanoContaHierarquico } from '@/backend/types/financeiro/plano-contas.types';

// ============================================================================
// Funções utilitárias para hierarquia do Plano de Contas
// Funções puras que podem ser usadas tanto no frontend quanto no backend
// ============================================================================

/**
 * Achatar hierarquia em lista com indentação
 * Útil para seletores com visualização hierárquica
 */
export const achatarHierarquia = (
  hierarquia: PlanoContaHierarquico[],
  nivel: number = 0
): Array<PlanoContaHierarquico & { nivelIndentacao: number }> => {
  const resultado: Array<PlanoContaHierarquico & { nivelIndentacao: number }> = [];

  for (const conta of hierarquia) {
    resultado.push({ ...conta, nivelIndentacao: nivel });

    if (conta.filhos && conta.filhos.length > 0) {
      resultado.push(...achatarHierarquia(conta.filhos, nivel + 1));
    }
  }

  return resultado;
};

/**
 * Encontrar conta na hierarquia por ID
 */
export const encontrarContaNaHierarquia = (
  hierarquia: PlanoContaHierarquico[],
  id: number
): PlanoContaHierarquico | null => {
  for (const conta of hierarquia) {
    if (conta.id === id) {
      return conta;
    }

    if (conta.filhos && conta.filhos.length > 0) {
      const encontrada = encontrarContaNaHierarquia(conta.filhos, id);
      if (encontrada) {
        return encontrada;
      }
    }
  }

  return null;
};

/**
 * Obter caminho completo de uma conta (breadcrumb)
 */
export const obterCaminhoCompleto = (
  hierarquia: PlanoContaHierarquico[],
  id: number,
  caminho: PlanoContaHierarquico[] = []
): PlanoContaHierarquico[] | null => {
  for (const conta of hierarquia) {
    const novoCaminho = [...caminho, conta];

    if (conta.id === id) {
      return novoCaminho;
    }

    if (conta.filhos && conta.filhos.length > 0) {
      const resultado = obterCaminhoCompleto(conta.filhos, id, novoCaminho);
      if (resultado) {
        return resultado;
      }
    }
  }

  return null;
};
