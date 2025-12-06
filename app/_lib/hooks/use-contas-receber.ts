'use client';

/**
 * Hook para buscar e gerenciar contas a receber
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  ContaReceberComDetalhes,
  ListarContasReceberParams,
  ListarContasReceberResponse,
  ResumoInadimplencia,
  StatusContaReceber,
  OrigemContaReceber,
} from '@/backend/types/financeiro/contas-receber.types';

// ============================================================================
// Types
// ============================================================================

interface UseContasReceberParams {
  pagina?: number;
  limite?: number;
  busca?: string;
  status?: StatusContaReceber | StatusContaReceber[];
  dataVencimentoInicio?: string;
  dataVencimentoFim?: string;
  dataCompetenciaInicio?: string;
  dataCompetenciaFim?: string;
  clienteId?: number;
  contratoId?: number;
  contaContabilId?: number;
  centroCustoId?: number;
  contaBancariaId?: number;
  categoria?: string;
  origem?: OrigemContaReceber;
  recorrente?: boolean;
  ordenarPor?: 'data_vencimento' | 'valor' | 'descricao' | 'status' | 'created_at';
  ordem?: 'asc' | 'desc';
  incluirResumo?: boolean;
}

interface UseContasReceberResult {
  contasReceber: ContaReceberComDetalhes[];
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  } | null;
  resumoInadimplencia: ResumoInadimplencia | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface ContasReceberApiResponse {
  success: boolean;
  data: ListarContasReceberResponse & {
    resumoInadimplencia?: ResumoInadimplencia;
  };
  error?: string;
}

// ============================================================================
// Hook Principal
// ============================================================================

/**
 * Hook para buscar contas a receber com filtros e paginação
 */
export const useContasReceber = (params: UseContasReceberParams = {}): UseContasReceberResult => {
  const [contasReceber, setContasReceber] = useState<ContaReceberComDetalhes[]>([]);
  const [paginacao, setPaginacao] = useState<UseContasReceberResult['paginacao']>(null);
  const [resumoInadimplencia, setResumoInadimplencia] = useState<ResumoInadimplencia | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscarContasReceber = useCallback(async () => {
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
      if (params.clienteId !== undefined) {
        searchParams.set('clienteId', params.clienteId.toString());
      }
      if (params.contratoId !== undefined) {
        searchParams.set('contratoId', params.contratoId.toString());
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

      const response = await fetch(`/api/financeiro/contas-receber?${searchParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data: ContasReceberApiResponse = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      setContasReceber(data.data.items);
      setPaginacao(data.data.paginacao);
      setResumoInadimplencia(data.data.resumoInadimplencia || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar contas a receber';
      setError(errorMessage);
      setContasReceber([]);
      setPaginacao(null);
      setResumoInadimplencia(null);
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
    params.clienteId,
    params.contratoId,
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
    buscarContasReceber();
  }, [buscarContasReceber]);

  return {
    contasReceber,
    paginacao,
    resumoInadimplencia,
    isLoading,
    error,
    refetch: buscarContasReceber,
  };
};

// ============================================================================
// Hook para Conta Individual
// ============================================================================

interface UseContaReceberResult {
  contaReceber: ContaReceberComDetalhes | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar uma conta a receber específica por ID
 */
export const useContaReceber = (id: number | null): UseContaReceberResult => {
  const [contaReceber, setContaReceber] = useState<ContaReceberComDetalhes | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarContaReceber = useCallback(async () => {
    if (!id) {
      setContaReceber(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/financeiro/contas-receber/${id}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      setContaReceber(data.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar conta a receber';
      setError(errorMessage);
      setContaReceber(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      buscarContaReceber();
    }
  }, [id, buscarContaReceber]);

  return {
    contaReceber,
    isLoading,
    error,
    refetch: buscarContaReceber,
  };
};

// ============================================================================
// Hook para Resumo de Inadimplência
// ============================================================================

interface UseResumoInadimplenciaResult {
  resumo: ResumoInadimplencia | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar resumo de inadimplência (alertas)
 */
export const useResumoInadimplencia = (): UseResumoInadimplenciaResult => {
  const [resumo, setResumo] = useState<ResumoInadimplencia | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscarResumo = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/financeiro/contas-receber?incluirResumo=true&limite=1');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      setResumo(data.data.resumoInadimplencia || null);
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
// Funções de Mutação (criar, atualizar, receber, cancelar)
// ============================================================================

interface MutationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Criar nova conta a receber
 */
export const criarContaReceber = async (
  dados: Record<string, unknown>
): Promise<MutationResult<ContaReceberComDetalhes>> => {
  try {
    const response = await fetch('/api/financeiro/contas-receber', {
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
 * Atualizar conta a receber existente
 */
export const atualizarContaReceber = async (
  id: number,
  dados: Record<string, unknown>
): Promise<MutationResult<ContaReceberComDetalhes>> => {
  try {
    const response = await fetch(`/api/financeiro/contas-receber/${id}`, {
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
 * Efetuar recebimento de conta
 */
export const receberConta = async (
  id: number,
  dados: {
    formaRecebimento: string;
    contaBancariaId: number;
    dataEfetivacao?: string;
    observacoes?: string;
  }
): Promise<MutationResult<ContaReceberComDetalhes>> => {
  try {
    const response = await fetch(`/api/financeiro/contas-receber/${id}/receber`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return { success: false, error: result.error || 'Erro ao efetuar recebimento' };
    }

    return { success: true, data: result.data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao efetuar recebimento',
    };
  }
};

/**
 * Cancelar conta a receber
 */
export const cancelarConta = async (
  id: number,
  motivo?: string
): Promise<MutationResult<ContaReceberComDetalhes>> => {
  try {
    const searchParams = new URLSearchParams();
    searchParams.set('modo', 'cancelar');
    if (motivo) {
      searchParams.set('motivo', motivo);
    }

    const response = await fetch(`/api/financeiro/contas-receber/${id}?${searchParams.toString()}`, {
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
 * Excluir conta a receber permanentemente
 */
export const excluirConta = async (id: number): Promise<MutationResult> => {
  try {
    const response = await fetch(`/api/financeiro/contas-receber/${id}?modo=excluir`, {
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
