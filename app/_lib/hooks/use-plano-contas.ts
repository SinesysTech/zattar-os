/**
 * Hook para gerenciar Plano de Contas
 */

import useSWR from 'swr';
import type {
  PlanoContaComPai,
  ListarPlanoContasResponse,
  TipoContaContabil,
  NivelConta,
} from '@/types/domain/financeiro';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(body.error || `Erro ${res.status}: ${res.statusText}`);
  }

  return body;
};

interface UsePlanoContasParams {
  pagina?: number;
  limite?: number;
  busca?: string;
  tipoConta?: TipoContaContabil;
  nivel?: NivelConta;
  ativo?: boolean;
  contaPaiId?: number | null;
  ordenarPor?: 'codigo' | 'nome' | 'ordem_exibicao' | 'created_at' | 'updated_at';
  ordem?: 'asc' | 'desc';
}

/**
 * Hook para listar plano de contas com filtros e paginação
 */
export function usePlanoContas(params: UsePlanoContasParams = {}) {
  const {
    pagina = 1,
    limite = 50,
    busca,
    tipoConta,
    nivel,
    ativo,
    contaPaiId,
    ordenarPor = 'codigo',
    ordem = 'asc',
  } = params;

  // Construir query string
  const queryParams = new URLSearchParams();
  queryParams.set('pagina', pagina.toString());
  queryParams.set('limite', limite.toString());
  queryParams.set('ordenarPor', ordenarPor);
  queryParams.set('ordem', ordem);

  if (busca) {
    queryParams.set('busca', busca);
  }

  if (tipoConta) {
    queryParams.set('tipoConta', tipoConta);
  }

  if (nivel) {
    queryParams.set('nivel', nivel);
  }

  if (ativo !== undefined) {
    queryParams.set('ativo', ativo.toString());
  }

  if (contaPaiId !== undefined) {
    queryParams.set('contaPaiId', contaPaiId === null ? 'null' : contaPaiId.toString());
  }

  const url = `/api/plano-contas?${queryParams.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: ListarPlanoContasResponse;
  }>(url, fetcher);

  return {
    planoContas: data?.data.items || [],
    paginacao: data?.data.paginacao,
    isLoading,
    error: error?.message || (data && !data.success ? 'Erro ao carregar dados' : undefined),
    mutate,
  };
}

/**
 * Hook simplificado para buscar todas as contas ativas
 * Útil para dropdowns e selects
 */
export function usePlanoContasAtivas() {
  const { planoContas, isLoading, error, mutate } = usePlanoContas({
    ativo: true,
    limite: 500,
    ordenarPor: 'codigo',
    ordem: 'asc',
  });

  return {
    planoContas,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Hook para buscar apenas contas analíticas ativas (que aceitam lançamentos)
 */
export function usePlanoContasAnaliticas() {
  const { planoContas, isLoading, error, mutate } = usePlanoContas({
    ativo: true,
    nivel: 'analitica',
    limite: 500,
    ordenarPor: 'codigo',
    ordem: 'asc',
  });

  return {
    planoContas,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Hook para buscar uma conta específica por ID
 */
export function usePlanoConta(id: number | null) {
  const url = id ? `/api/plano-contas/${id}` : null;

  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: PlanoContaComPai;
  }>(url, fetcher);

  return {
    planoConta: data?.data,
    isLoading,
    error: error?.message || (data && !data.success ? 'Erro ao carregar conta' : undefined),
    mutate,
  };
}

/**
 * Hook para buscar uma conta por código
 */
export function usePlanoContaPorCodigo(codigo: string | null) {
  const url = codigo ? `/api/plano-contas/codigo/${encodeURIComponent(codigo)}` : null;

  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: PlanoContaComPai;
  }>(url, fetcher);

  return {
    planoConta: data?.data,
    isLoading,
    error: error?.message || (data && !data.success ? 'Erro ao carregar conta' : undefined),
    mutate,
  };
}
