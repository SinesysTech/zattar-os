/**
 * Hook para gerenciar Centros de Custo
 */

import useSWR from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(body.error || `Erro ${res.status}: ${res.statusText}`);
  }

  return body;
};

interface CentroCusto {
  id: number;
  codigo: string;
  nome: string;
  ativo: boolean;
}

interface ListarCentrosCustoResponse {
  items: CentroCusto[];
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  };
}

interface UseCentrosCustoParams {
  pagina?: number;
  limite?: number;
  busca?: string;
  ativo?: boolean;
}

/**
 * Hook para listar centros de custo com filtros e paginação
 */
export function useCentrosCusto(params: UseCentrosCustoParams = {}) {
  const { pagina = 1, limite = 100, busca, ativo = true } = params;

  // Construir query string
  const queryParams = new URLSearchParams();
  queryParams.set('pagina', pagina.toString());
  queryParams.set('limite', limite.toString());
  queryParams.set('ativo', ativo.toString());

  if (busca) {
    queryParams.set('busca', busca);
  }

  const url = `/api/centros-custo?${queryParams.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: ListarCentrosCustoResponse;
  }>(url, fetcher);

  return {
    centrosCusto: data?.data.items || [],
    paginacao: data?.data.paginacao,
    isLoading,
    error: error?.message || (data && !data.success ? 'Erro ao carregar dados' : undefined),
    mutate,
  };
}

/**
 * Hook simplificado para buscar todos os centros de custo ativos
 * Útil para dropdowns e selects
 */
export function useCentrosCustoAtivos() {
  const { centrosCusto, isLoading, error, mutate } = useCentrosCusto({
    ativo: true,
    limite: 500,
  });

  return {
    centrosCusto,
    isLoading,
    error,
    mutate,
  };
}
