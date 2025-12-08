'use client';

/**
 * Hook para buscar e gerenciar contas a pagar
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  ContaPagarComDetalhes,
  ListarContasPagarResponse,
  ResumoVencimentos,
  StatusContaPagar,
  OrigemContaPagar,
} from '@/backend/types/financeiro/contas-pagar.types';

// ============================================================================
// Types
// ============================================================================

interface UseContasPagarParams {
  pagina?: number;
  limite?: number;
  busca?: string;
  status?: StatusContaPagar | StatusContaPagar[];
  dataVencimentoInicio?: string;
  dataVencimentoFim?: string;
  dataCompetenciaInicio?: string;
  dataCompetenciaFim?: string;
  fornecedorId?: number;
  contaContabilId?: number;
  centroCustoId?: number;
  contaBancariaId?: number;
  categoria?: string;
  origem?: OrigemContaPagar;
  recorrente?: boolean;
  ordenarPor?: 'data_vencimento' | 'valor' | 'descricao' | 'status' | 'created_at';
  ordem?: 'asc' | 'desc';
  incluirResumo?: boolean;
}

interface UseContasPagarResult {
  contasPagar: ContaPagarComDetalhes[];
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  } | null;
  resumoVencimentos: ResumoVencimentos | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface ContasPagarApiResponse {
  success: boolean;
  data: ListarContasPagarResponse & {
    resumoVencimentos?: ResumoVencimentos;
  };
  error?: string;
}

// ============================================================================
// Hook Principal
// ============================================================================

/**
 * Hook para buscar contas a pagar com filtros e paginação
 */
export const useContasPagar = (params: UseContasPagarParams = {}): UseContasPagarResult => {
  const [contasPagar, setContasPagar] = useState<ContaPagarComDetalhes[]>([]);
  const [paginacao, setPaginacao] = useState<UseContasPagarResult['paginacao']>(null);
  const [resumoVencimentos, setResumoVencimentos] = useState<ResumoVencimentos | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscarContasPagar = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Construir query string
      const searchParams = new URLSearchParams();

      if (params.pagina !== undefined) {
        searchParams.set('pagina', params.pagina.toString());
      }
      if (params.limite !== undefined) {
        searchParams.set('limite', params.limite.toString());
      }
      if (params.busca) {
        searchParams.set('busca', params.busca);
      }
      if (params.status) {
        if (Array.isArray(params.status)) {
          params.status.forEach((s) => searchParams.append('status', s));
        } else {
          searchParams.set('status', params.status);
        }
      }
      if (params.dataVencimentoInicio) {
        searchParams.set('dataVencimentoInicio', params.dataVencimentoInicio);
      }
      if (params.dataVencimentoFim) {
        searchParams.set('dataVencimentoFim', params.dataVencimentoFim);
      }
      if (params.dataCompetenciaInicio) {
        searchParams.set('dataCompetenciaInicio', params.dataCompetenciaInicio);
      }
      if (params.dataCompetenciaFim) {
        searchParams.set('dataCompetenciaFim', params.dataCompetenciaFim);
      }
      if (params.fornecedorId !== undefined) {
        searchParams.set('fornecedorId', params.fornecedorId.toString());
      }
      if (params.contaContabilId !== undefined) {
        searchParams.set('contaContabilId', params.contaContabilId.toString());
      }
      if (params.centroCustoId !== undefined) {
        searchParams.set('centroCustoId', params.centroCustoId.toString());
      }
      if (params.contaBancariaId !== undefined) {
        searchParams.set('contaBancariaId', params.contaBancariaId.toString());
      }
      if (params.categoria) {
        searchParams.set('categoria', params.categoria);
      }
      if (params.origem) {
        searchParams.set('origem', params.origem);
      }
      if (params.recorrente !== undefined) {
        searchParams.set('recorrente', params.recorrente.toString());
      }
      if (params.ordenarPor) {
        searchParams.set('ordenarPor', params.ordenarPor);
      }
      if (params.ordem) {
        searchParams.set('ordem', params.ordem);
      }
      if (params.incluirResumo) {
        searchParams.set('incluirResumo', 'true');
      }

      const response = await fetch(`/api/financeiro/contas-pagar?${searchParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data: ContasPagarApiResponse = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      setContasPagar(data.data.items);
      setPaginacao(data.data.paginacao);
      setResumoVencimentos(data.data.resumoVencimentos || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar contas a pagar';
      setError(errorMessage);
      setContasPagar([]);
      setPaginacao(null);
      setResumoVencimentos(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    params.pagina,
    params.limite,
    params.busca,
    params.status,
    params.dataVencimentoInicio,
    params.dataVencimentoFim,
    params.dataCompetenciaInicio,
    params.dataCompetenciaFim,
    params.fornecedorId,
    params.contaContabilId,
    params.centroCustoId,
    params.contaBancariaId,
    params.categoria,
    params.origem,
    params.recorrente,
    params.ordenarPor,
    params.ordem,
    params.incluirResumo,
  ]);

  useEffect(() => {
    buscarContasPagar();
  }, [buscarContasPagar]);

  return {
    contasPagar,
    paginacao,
    resumoVencimentos,
    isLoading,
    error,
    refetch: buscarContasPagar,
  };
};

// ============================================================================
// Hook para Conta Individual
// ============================================================================

interface UseContaPagarResult {
  contaPagar: ContaPagarComDetalhes | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar uma conta a pagar específica por ID
 */
export const useContaPagar = (id: number | null): UseContaPagarResult => {
  const [contaPagar, setContaPagar] = useState<ContaPagarComDetalhes | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarContaPagar = useCallback(async () => {
    if (!id) {
      setContaPagar(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/financeiro/contas-pagar/${id}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      setContaPagar(data.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar conta a pagar';
      setError(errorMessage);
      setContaPagar(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      buscarContaPagar();
    }
  }, [id, buscarContaPagar]);

  return {
    contaPagar,
    isLoading,
    error,
    refetch: buscarContaPagar,
  };
};

// ============================================================================
// Hook para Resumo de Vencimentos
// ============================================================================

interface UseResumoVencimentosResult {
  resumo: ResumoVencimentos | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar resumo de vencimentos (alertas)
 */
export const useResumoVencimentos = (): UseResumoVencimentosResult => {
  const [resumo, setResumo] = useState<ResumoVencimentos | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscarResumo = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/financeiro/contas-pagar?incluirResumo=true&limite=1');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      setResumo(data.data.resumoVencimentos || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar resumo';
      setError(errorMessage);
      setResumo(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    buscarResumo();
  }, [buscarResumo]);

  return {
    resumo,
    isLoading,
    error,
    refetch: buscarResumo,
  };
};

// ============================================================================
// Funções de Mutação (criar, atualizar, pagar, cancelar)
// ============================================================================

interface MutationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Criar nova conta a pagar
 */
export const criarContaPagar = async (
  dados: Record<string, unknown>
): Promise<MutationResult<ContaPagarComDetalhes>> => {
  try {
    const response = await fetch('/api/financeiro/contas-pagar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return { success: false, error: result.error || 'Erro ao criar conta' };
    }

    return { success: true, data: result.data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao criar conta',
    };
  }
};

/**
 * Atualizar conta a pagar existente
 */
export const atualizarContaPagar = async (
  id: number,
  dados: Record<string, unknown>
): Promise<MutationResult<ContaPagarComDetalhes>> => {
  try {
    const response = await fetch(`/api/financeiro/contas-pagar/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return { success: false, error: result.error || 'Erro ao atualizar conta' };
    }

    return { success: true, data: result.data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao atualizar conta',
    };
  }
};

/**
 * Efetuar pagamento de conta
 */
export const pagarConta = async (
  id: number,
  dados: {
    formaPagamento: string;
    contaBancariaId: number;
    dataEfetivacao?: string;
    observacoes?: string;
  }
): Promise<MutationResult<ContaPagarComDetalhes>> => {
  try {
    const response = await fetch(`/api/financeiro/contas-pagar/${id}/pagar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return { success: false, error: result.error || 'Erro ao efetuar pagamento' };
    }

    return { success: true, data: result.data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao efetuar pagamento',
    };
  }
};

/**
 * Cancelar conta a pagar
 */
export const cancelarConta = async (
  id: number,
  motivo?: string
): Promise<MutationResult<ContaPagarComDetalhes>> => {
  try {
    const searchParams = new URLSearchParams();
    searchParams.set('modo', 'cancelar');
    if (motivo) {
      searchParams.set('motivo', motivo);
    }

    const response = await fetch(`/api/financeiro/contas-pagar/${id}?${searchParams.toString()}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return { success: false, error: result.error || 'Erro ao cancelar conta' };
    }

    return { success: true, data: result.data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao cancelar conta',
    };
  }
};

/**
 * Excluir conta a pagar permanentemente
 */
export const excluirConta = async (id: number): Promise<MutationResult> => {
  try {
    const response = await fetch(`/api/financeiro/contas-pagar/${id}?modo=excluir`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return { success: false, error: result.error || 'Erro ao excluir conta' };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao excluir conta',
    };
  }
};
