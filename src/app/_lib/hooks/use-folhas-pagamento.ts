'use client';

/**
 * Hook para buscar e gerenciar folhas de pagamento
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  FolhaPagamentoComDetalhes,
  ListarFolhasResponse,
  StatusFolhaPagamento,
  TotaisFolhasPorStatus,
  GerarFolhaDTO,
  AprovarFolhaDTO,
  PagarFolhaDTO,
} from '@/backend/types/financeiro/salarios.types';

// ============================================================================
// Types
// ============================================================================

interface UseFolhasPagamentoParams {
  pagina?: number;
  limite?: number;
  mesReferencia?: number;
  anoReferencia?: number;
  status?: StatusFolhaPagamento | StatusFolhaPagamento[];
  ordenarPor?: 'periodo' | 'valor_total' | 'status' | 'created_at';
  ordem?: 'asc' | 'desc';
  incluirTotais?: boolean;
}

interface UseFolhasPagamentoResult {
  folhas: FolhaPagamentoComDetalhes[];
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  } | null;
  totais: TotaisFolhasPorStatus | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface FolhasPagamentoApiResponse {
  success: boolean;
  data: ListarFolhasResponse & {
    totais?: TotaisFolhasPorStatus;
  };
  error?: string;
}

// ============================================================================
// Hook Principal
// ============================================================================

/**
 * Hook para buscar folhas de pagamento com filtros e paginação
 */
export const useFolhasPagamento = (params: UseFolhasPagamentoParams = {}): UseFolhasPagamentoResult => {
  const [folhas, setFolhas] = useState<FolhaPagamentoComDetalhes[]>([]);
  const [paginacao, setPaginacao] = useState<UseFolhasPagamentoResult['paginacao']>(null);
  const [totais, setTotais] = useState<TotaisFolhasPorStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscarFolhas = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();

      if (params.pagina !== undefined) {
        searchParams.set('pagina', params.pagina.toString());
      }
      if (params.limite !== undefined) {
        searchParams.set('limite', params.limite.toString());
      }
      if (params.mesReferencia !== undefined) {
        searchParams.set('mesReferencia', params.mesReferencia.toString());
      }
      if (params.anoReferencia !== undefined) {
        searchParams.set('anoReferencia', params.anoReferencia.toString());
      }
      if (params.status) {
        if (Array.isArray(params.status)) {
          params.status.forEach((s) => searchParams.append('status', s));
        } else {
          searchParams.set('status', params.status);
        }
      }
      if (params.ordenarPor) {
        searchParams.set('ordenarPor', params.ordenarPor);
      }
      if (params.ordem) {
        searchParams.set('ordem', params.ordem);
      }
      if (params.incluirTotais) {
        searchParams.set('incluirTotais', 'true');
      }

      const response = await fetch(`/api/rh/folhas-pagamento?${searchParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data: FolhasPagamentoApiResponse = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      setFolhas(data.data.items);
      setPaginacao(data.data.paginacao);
      setTotais(data.data.totais || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar folhas de pagamento';
      setError(errorMessage);
      setFolhas([]);
      setPaginacao(null);
      setTotais(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    params.pagina,
    params.limite,
    params.mesReferencia,
    params.anoReferencia,
    params.status,
    params.ordenarPor,
    params.ordem,
    params.incluirTotais,
  ]);

  useEffect(() => {
    buscarFolhas();
  }, [buscarFolhas]);

  return {
    folhas,
    paginacao,
    totais,
    isLoading,
    error,
    refetch: buscarFolhas,
  };
};

// ============================================================================
// Hook para Folha Individual
// ============================================================================

interface UseFolhaPagamentoResult {
  folha: FolhaPagamentoComDetalhes | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar uma folha de pagamento específica por ID
 */
export const useFolhaPagamento = (id: number | null): UseFolhaPagamentoResult => {
  const [folha, setFolha] = useState<FolhaPagamentoComDetalhes | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarFolha = useCallback(async () => {
    if (!id) {
      setFolha(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/rh/folhas-pagamento/${id}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      setFolha(data.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar folha de pagamento';
      setError(errorMessage);
      setFolha(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    buscarFolha();
  }, [buscarFolha]);

  return {
    folha,
    isLoading,
    error,
    refetch: buscarFolha,
  };
};

// ============================================================================
// Hook para Folha por Período
// ============================================================================

interface UseFolhaDoPeriodoParams {
  ano: number | null;
  mes: number | null;
}

/**
 * Hook para buscar folha de um período específico
 */
export const useFolhaDoPeriodo = (params: UseFolhaDoPeriodoParams): UseFolhaPagamentoResult => {
  const [folha, setFolha] = useState<FolhaPagamentoComDetalhes | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarFolhaDoPeriodo = useCallback(async () => {
    if (!params.ano || !params.mes) {
      setFolha(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/rh/folhas-pagamento/periodo/${params.ano}/${params.mes}`);

      if (!response.ok) {
        if (response.status === 404) {
          // Não existe folha para o período
          setFolha(null);
          return;
        }
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      setFolha(data.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar folha do período';
      setError(errorMessage);
      setFolha(null);
    } finally {
      setIsLoading(false);
    }
  }, [params.ano, params.mes]);

  useEffect(() => {
    buscarFolhaDoPeriodo();
  }, [buscarFolhaDoPeriodo]);

  return {
    folha,
    isLoading,
    error,
    refetch: buscarFolhaDoPeriodo,
  };
};

// ============================================================================
// Mutation Functions
// ============================================================================

interface MutationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Preview de geração de folha (não cria a folha)
 */
export const previewGerarFolha = async (
  mesReferencia: number,
  anoReferencia: number
): Promise<MutationResult<{
  salariosVigentes: Array<{
    usuarioId: number;
    nomeExibicao: string;
    cargo?: string;
    salarioBruto: number;
  }>;
  valorTotal: number;
  totalFuncionarios: number;
  periodoLabel: string;
}>> => {
  try {
    const response = await fetch('/api/rh/folhas-pagamento', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mesReferencia,
        anoReferencia,
        preview: true,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Erro ao gerar preview',
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao gerar preview',
    };
  }
};

/**
 * Gerar nova folha de pagamento
 */
export const gerarFolha = async (dados: GerarFolhaDTO): Promise<MutationResult<FolhaPagamentoComDetalhes>> => {
  try {
    const response = await fetch('/api/rh/folhas-pagamento', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dados),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Erro ao gerar folha',
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao gerar folha',
    };
  }
};

/**
 * Atualizar folha de pagamento (apenas rascunho)
 */
export const atualizarFolha = async (
  id: number,
  dados: { dataPagamento?: string | null; observacoes?: string | null }
): Promise<MutationResult<FolhaPagamentoComDetalhes>> => {
  try {
    const response = await fetch(`/api/rh/folhas-pagamento/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dados),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Erro ao atualizar folha',
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao atualizar folha',
    };
  }
};

/**
 * Aprovar folha de pagamento
 */
export const aprovarFolha = async (
  id: number,
  dados: AprovarFolhaDTO
): Promise<MutationResult<FolhaPagamentoComDetalhes>> => {
  try {
    const response = await fetch(`/api/rh/folhas-pagamento/${id}/aprovar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dados),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Erro ao aprovar folha',
      };
    }

    return {
      success: true,
      data: result.data,
      message: result.message,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao aprovar folha',
    };
  }
};

/**
 * Pagar folha de pagamento
 */
export const pagarFolha = async (
  id: number,
  dados: PagarFolhaDTO
): Promise<MutationResult<FolhaPagamentoComDetalhes>> => {
  try {
    const response = await fetch(`/api/rh/folhas-pagamento/${id}/pagar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dados),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Erro ao pagar folha',
      };
    }

    return {
      success: true,
      data: result.data,
      message: result.message,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao pagar folha',
    };
  }
};

/**
 * Verificar se pode cancelar uma folha
 */
export const verificarCancelamentoFolha = async (id: number): Promise<MutationResult<{
  podeCancelar: boolean;
  motivo?: string;
  status: string;
  temLancamentosPagos: boolean;
}>> => {
  try {
    const response = await fetch(`/api/rh/folhas-pagamento/${id}?modo=verificar`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Erro ao verificar cancelamento',
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao verificar cancelamento',
    };
  }
};

/**
 * Cancelar folha de pagamento
 */
export const cancelarFolha = async (
  id: number,
  motivo?: string
): Promise<MutationResult<FolhaPagamentoComDetalhes>> => {
  try {
    const searchParams = new URLSearchParams({ modo: 'cancelar' });
    if (motivo) {
      searchParams.set('motivo', motivo);
    }

    const response = await fetch(`/api/rh/folhas-pagamento/${id}?${searchParams.toString()}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Erro ao cancelar folha',
      };
    }

    return {
      success: true,
      data: result.data,
      message: result.message,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao cancelar folha',
    };
  }
};

/**
 * Excluir folha de pagamento (apenas rascunho)
 */
export const excluirFolha = async (id: number): Promise<MutationResult> => {
  try {
    const response = await fetch(`/api/rh/folhas-pagamento/${id}?modo=excluir`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Erro ao excluir folha',
      };
    }

    return {
      success: true,
      message: result.message,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao excluir folha',
    };
  }
};

/**
 * Obter resumo para pagamento de uma folha
 */
export const obterResumoParaPagamento = async (id: number): Promise<MutationResult<{
  totalBruto: number;
  totalItens: number;
  itensPendentes: number;
  itensConfirmados: number;
}>> => {
  try {
    const response = await fetch(`/api/rh/folhas-pagamento/${id}/pagar`);

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Erro ao obter resumo',
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao obter resumo',
    };
  }
};
