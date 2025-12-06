/**
 * Hook para gerenciar Hierarquia do Plano de Contas
 */

import useSWR from 'swr';
import type {
  PlanoContaHierarquico,
  PlanoConta,
} from '@/types/domain/financeiro';

// Re-exporta funções utilitárias do módulo compartilhado para consumidores deste hook
export {
  achatarHierarquia,
  encontrarContaNaHierarquia,
  obterCaminhoCompleto,
} from '@/types/domain/financeiro';

// Importa para uso interno
import { achatarHierarquia } from '@/types/domain/financeiro';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(body.error || `Erro ${res.status}: ${res.statusText}`);
  }

  return body;
};

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
