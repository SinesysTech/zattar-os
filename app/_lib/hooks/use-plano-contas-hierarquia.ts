/**
 * Hook para gerenciar Hierarquia do Plano de Contas
 */

import useSWR from 'swr';
import type {
  PlanoContaHierarquico,
  PlanoConta,
} from '@/backend/types/financeiro/plano-contas.types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Hook para obter a estrutura hierárquica completa do plano de contas
 */
export function usePlanoContasHierarquia() {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: PlanoContaHierarquico[];
  }>('/api/plano-contas/hierarquia', fetcher);

  return {
    hierarquia: data?.data || [],
    isLoading,
    error: error?.message || (data && !data.success ? 'Erro ao carregar hierarquia' : undefined),
    mutate,
  };
}

/**
 * Hook para obter apenas contas sintéticas (para seletores de conta pai)
 */
export function usePlanoContasSinteticas() {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: PlanoConta[];
  }>('/api/plano-contas/hierarquia?sinteticasApenas=true', fetcher);

  return {
    contasSinteticas: data?.data || [],
    isLoading,
    error: error?.message || (data && !data.success ? 'Erro ao carregar contas sintéticas' : undefined),
    mutate,
  };
}

/**
 * Achatar hierarquia em lista com indentação
 * Útil para seletores com visualização hierárquica
 */
export function achatarHierarquia(
  hierarquia: PlanoContaHierarquico[],
  nivel: number = 0
): Array<PlanoContaHierarquico & { nivelIndentacao: number }> {
  const resultado: Array<PlanoContaHierarquico & { nivelIndentacao: number }> = [];

  for (const conta of hierarquia) {
    resultado.push({ ...conta, nivelIndentacao: nivel });

    if (conta.filhos && conta.filhos.length > 0) {
      resultado.push(...achatarHierarquia(conta.filhos, nivel + 1));
    }
  }

  return resultado;
}

/**
 * Hook que retorna hierarquia achatada para uso em selects
 */
export function usePlanoContasHierarquiaAchatada() {
  const { hierarquia, isLoading, error, mutate } = usePlanoContasHierarquia();

  const contasAchatadas = hierarquia.length > 0 ? achatarHierarquia(hierarquia) : [];

  return {
    contas: contasAchatadas,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Encontrar conta na hierarquia por ID
 */
export function encontrarContaNaHierarquia(
  hierarquia: PlanoContaHierarquico[],
  id: number
): PlanoContaHierarquico | null {
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
}

/**
 * Formatar código com indentação visual
 */
export function formatarCodigoComIndentacao(
  codigo: string,
  nivelIndentacao: number
): string {
  const prefixo = '\u00A0\u00A0'.repeat(nivelIndentacao); // Non-breaking spaces
  return `${prefixo}${codigo}`;
}

/**
 * Formatar nome com indentação visual
 */
export function formatarNomeComIndentacao(
  nome: string,
  nivelIndentacao: number
): string {
  const prefixo = '\u00A0\u00A0'.repeat(nivelIndentacao);
  return `${prefixo}${nome}`;
}

/**
 * Gerar label completo para seletor (código + nome com indentação)
 */
export function gerarLabelParaSeletor(
  conta: PlanoContaHierarquico & { nivelIndentacao: number }
): string {
  const prefixo = '\u00A0\u00A0'.repeat(conta.nivelIndentacao);
  return `${prefixo}${conta.codigo} - ${conta.nome}`;
}
