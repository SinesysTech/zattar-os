'use client';

/**
 * Hooks para buscar e gerenciar obrigações financeiras consolidadas
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  ObrigacaoComDetalhes,
  ListarObrigacoesResponse,
  ResumoObrigacoes,
  TipoObrigacao,
  StatusObrigacao,
  SincronizarObrigacoesResult,
  VerificarConsistenciaResult,
} from '@/backend/types/financeiro/obrigacoes.types';

// ============================================================================
// Types
// ============================================================================

interface UseObrigacoesParams {
  pagina?: number;
  limite?: number;
  busca?: string;
  tipos?: TipoObrigacao[];
  status?: StatusObrigacao[];
  dataVencimentoInicio?: string;
  dataVencimentoFim?: string;
  dataCompetenciaInicio?: string;
  dataCompetenciaFim?: string;
  clienteId?: number;
  processoId?: number;
  acordoId?: number;
  contaContabilId?: number;
  centroCustoId?: number;
  apenasVencidas?: boolean;
  apenasInconsistentes?: boolean;
  ordenarPor?: 'data_vencimento' | 'valor' | 'descricao' | 'status' | 'tipo' | 'created_at';
  ordem?: 'asc' | 'desc';
}

interface UseObrigacoesResult {
  obrigacoes: ObrigacaoComDetalhes[];
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  } | null;
  resumo: ResumoObrigacoes | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface ObrigacoesApiResponse {
  success: boolean;
  data: ListarObrigacoesResponse;
  error?: string;
}

// ============================================================================
// Hook Principal - Lista de Obrigações
// ============================================================================

/**
 * Hook para buscar obrigações consolidadas com filtros e paginação
 */
export const useObrigacoes = (params: UseObrigacoesParams = {}): UseObrigacoesResult => {
  const [obrigacoes, setObrigacoes] = useState<ObrigacaoComDetalhes[]>([]);
  const [paginacao, setPaginacao] = useState<UseObrigacoesResult['paginacao']>(null);
  const [resumo, setResumo] = useState<ResumoObrigacoes | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscarObrigacoes = useCallback(async () => {
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
      if (params.tipos && params.tipos.length > 0) {
        params.tipos.forEach((t) => searchParams.append('tipos', t));
      }
      if (params.status && params.status.length > 0) {
        params.status.forEach((s) => searchParams.append('status', s));
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
      if (params.processoId !== undefined) {
        searchParams.set('processoId', params.processoId.toString());
      }
      if (params.acordoId !== undefined) {
        searchParams.set('acordoId', params.acordoId.toString());
      }
      if (params.contaContabilId !== undefined) {
        searchParams.set('contaContabilId', params.contaContabilId.toString());
      }
      if (params.centroCustoId !== undefined) {
        searchParams.set('centroCustoId', params.centroCustoId.toString());
      }
      if (params.apenasVencidas) {
        searchParams.set('apenasVencidas', 'true');
      }
      if (params.apenasInconsistentes) {
        searchParams.set('apenasInconsistentes', 'true');
      }
      if (params.ordenarPor) {
        searchParams.set('ordenarPor', params.ordenarPor);
      }
      if (params.ordem) {
        searchParams.set('ordem', params.ordem);
      }

      const response = await fetch(`/api/financeiro/obrigacoes?${searchParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data: ObrigacoesApiResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Resposta da API indicou falha');
      }

      setObrigacoes(data.data.items);
      setPaginacao(data.data.paginacao);
      setResumo(data.data.resumo);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar obrigações';
      setError(errorMessage);
      setObrigacoes([]);
      setPaginacao(null);
      setResumo(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    params.pagina,
    params.limite,
    params.busca,
    params.tipos,
    params.status,
    params.dataVencimentoInicio,
    params.dataVencimentoFim,
    params.dataCompetenciaInicio,
    params.dataCompetenciaFim,
    params.clienteId,
    params.processoId,
    params.acordoId,
    params.contaContabilId,
    params.centroCustoId,
    params.apenasVencidas,
    params.apenasInconsistentes,
    params.ordenarPor,
    params.ordem,
  ]);

  useEffect(() => {
    buscarObrigacoes();
  }, [buscarObrigacoes]);

  return {
    obrigacoes,
    paginacao,
    resumo,
    isLoading,
    error,
    refetch: buscarObrigacoes,
  };
};

// ============================================================================
// Hook para Resumo de Obrigações
// ============================================================================

interface UseResumoObrigacoesParams {
  dataVencimentoInicio?: string;
  dataVencimentoFim?: string;
  clienteId?: number;
  processoId?: number;
  incluirAlertas?: boolean;
  incluirEstatisticas?: boolean;
}

interface AlertasObrigacoes {
  vencidas: { quantidade: number; valor: number; items: ObrigacaoComDetalhes[] };
  vencendoHoje: { quantidade: number; valor: number; items: ObrigacaoComDetalhes[] };
  vencendoEm7Dias: { quantidade: number; valor: number; items: ObrigacaoComDetalhes[] };
  inconsistentes: { quantidade: number; items: ObrigacaoComDetalhes[] };
}

interface EstatisticasObrigacoes {
  totalGeral: number;
  valorTotalGeral: number;
  receitasPendentes: number;
  despesasPendentes: number;
  taxaSincronizacao: number;
  taxaAdimplencia: number;
}

interface UseResumoObrigacoesResult {
  resumo: ResumoObrigacoes | null;
  alertas: AlertasObrigacoes | null;
  estatisticas: EstatisticasObrigacoes | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar resumo de obrigações (para dashboard)
 */
export const useResumoObrigacoes = (
  params: UseResumoObrigacoesParams = {}
): UseResumoObrigacoesResult => {
  const [resumo, setResumo] = useState<ResumoObrigacoes | null>(null);
  const [alertas, setAlertas] = useState<AlertasObrigacoes | null>(null);
  const [estatisticas, setEstatisticas] = useState<EstatisticasObrigacoes | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscarResumo = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();

      if (params.dataVencimentoInicio) {
        searchParams.set('dataVencimentoInicio', params.dataVencimentoInicio);
      }
      if (params.dataVencimentoFim) {
        searchParams.set('dataVencimentoFim', params.dataVencimentoFim);
      }
      if (params.clienteId !== undefined) {
        searchParams.set('clienteId', params.clienteId.toString());
      }
      if (params.processoId !== undefined) {
        searchParams.set('processoId', params.processoId.toString());
      }
      if (params.incluirAlertas) {
        searchParams.set('incluirAlertas', 'true');
      }
      if (params.incluirEstatisticas) {
        searchParams.set('incluirEstatisticas', 'true');
      }

      const response = await fetch(`/api/financeiro/obrigacoes/resumo?${searchParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Resposta da API indicou falha');
      }

      setResumo(data.data.resumo);
      setAlertas(data.data.alertas || null);
      setEstatisticas(data.data.estatisticas || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar resumo';
      setError(errorMessage);
      setResumo(null);
      setAlertas(null);
      setEstatisticas(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    params.dataVencimentoInicio,
    params.dataVencimentoFim,
    params.clienteId,
    params.processoId,
    params.incluirAlertas,
    params.incluirEstatisticas,
  ]);

  useEffect(() => {
    buscarResumo();
  }, [buscarResumo]);

  return {
    resumo,
    alertas,
    estatisticas,
    isLoading,
    error,
    refetch: buscarResumo,
  };
};

// ============================================================================
// Hook para Obrigações por Cliente
// ============================================================================

/**
 * Hook para buscar obrigações de um cliente específico
 */
export const useObrigacoesCliente = (
  clienteId: number | null,
  params: Omit<UseObrigacoesParams, 'clienteId'> = {}
): UseObrigacoesResult => {
  const [obrigacoes, setObrigacoes] = useState<ObrigacaoComDetalhes[]>([]);
  const [paginacao, setPaginacao] = useState<UseObrigacoesResult['paginacao']>(null);
  const [resumo, setResumo] = useState<ResumoObrigacoes | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarObrigacoes = useCallback(async () => {
    if (!clienteId) {
      setObrigacoes([]);
      setPaginacao(null);
      setResumo(null);
      return;
    }

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
      if (params.tipos && params.tipos.length > 0) {
        params.tipos.forEach((t) => searchParams.append('tipos', t));
      }
      if (params.status && params.status.length > 0) {
        params.status.forEach((s) => searchParams.append('status', s));
      }

      const response = await fetch(
        `/api/financeiro/obrigacoes/cliente/${clienteId}?${searchParams.toString()}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data: ObrigacoesApiResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Resposta da API indicou falha');
      }

      setObrigacoes(data.data.items);
      setPaginacao(data.data.paginacao);
      setResumo(data.data.resumo);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar obrigações';
      setError(errorMessage);
      setObrigacoes([]);
      setPaginacao(null);
      setResumo(null);
    } finally {
      setIsLoading(false);
    }
  }, [clienteId, params.pagina, params.limite, params.tipos, params.status]);

  useEffect(() => {
    if (clienteId) {
      buscarObrigacoes();
    }
  }, [clienteId, buscarObrigacoes]);

  return {
    obrigacoes,
    paginacao,
    resumo,
    isLoading,
    error,
    refetch: buscarObrigacoes,
  };
};

// ============================================================================
// Hook para Obrigações por Processo
// ============================================================================

/**
 * Hook para buscar obrigações de um processo específico
 */
export const useObrigacoesProcesso = (
  processoId: number | null,
  params: Omit<UseObrigacoesParams, 'processoId'> = {}
): UseObrigacoesResult => {
  const [obrigacoes, setObrigacoes] = useState<ObrigacaoComDetalhes[]>([]);
  const [paginacao, setPaginacao] = useState<UseObrigacoesResult['paginacao']>(null);
  const [resumo, setResumo] = useState<ResumoObrigacoes | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarObrigacoes = useCallback(async () => {
    if (!processoId) {
      setObrigacoes([]);
      setPaginacao(null);
      setResumo(null);
      return;
    }

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
      if (params.tipos && params.tipos.length > 0) {
        params.tipos.forEach((t) => searchParams.append('tipos', t));
      }
      if (params.status && params.status.length > 0) {
        params.status.forEach((s) => searchParams.append('status', s));
      }

      const response = await fetch(
        `/api/financeiro/obrigacoes/processo/${processoId}?${searchParams.toString()}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data: ObrigacoesApiResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Resposta da API indicou falha');
      }

      setObrigacoes(data.data.items);
      setPaginacao(data.data.paginacao);
      setResumo(data.data.resumo);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar obrigações';
      setError(errorMessage);
      setObrigacoes([]);
      setPaginacao(null);
      setResumo(null);
    } finally {
      setIsLoading(false);
    }
  }, [processoId, params.pagina, params.limite, params.tipos, params.status]);

  useEffect(() => {
    if (processoId) {
      buscarObrigacoes();
    }
  }, [processoId, buscarObrigacoes]);

  return {
    obrigacoes,
    paginacao,
    resumo,
    isLoading,
    error,
    refetch: buscarObrigacoes,
  };
};

// ============================================================================
// Funções de Mutação (sincronização, verificação)
// ============================================================================

interface MutationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Sincronizar parcela com o sistema financeiro
 */
export const sincronizarParcela = async (
  parcelaId: number,
  forcar: boolean = false
): Promise<MutationResult<SincronizarObrigacoesResult>> => {
  try {
    const response = await fetch('/api/financeiro/obrigacoes/sincronizar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parcelaId, forcar }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return { success: false, error: result.error || 'Erro ao sincronizar' };
    }

    return { success: true, data: result.data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao sincronizar',
    };
  }
};

/**
 * Sincronizar acordo completo com o sistema financeiro
 */
export const sincronizarAcordo = async (
  acordoId: number,
  forcar: boolean = false
): Promise<MutationResult<SincronizarObrigacoesResult>> => {
  try {
    const response = await fetch('/api/financeiro/obrigacoes/sincronizar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acordoId, forcar }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return { success: false, error: result.error || 'Erro ao sincronizar acordo' };
    }

    return { success: true, data: result.data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao sincronizar acordo',
    };
  }
};

/**
 * Sincronizar múltiplos acordos em lote
 */
export const sincronizarAcordosEmLote = async (
  acordoIds: number[],
  forcar: boolean = false
): Promise<MutationResult<SincronizarObrigacoesResult>> => {
  try {
    const response = await fetch('/api/financeiro/obrigacoes/sincronizar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acordoIds, forcar }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return { success: false, error: result.error || 'Erro ao sincronizar acordos' };
    }

    return { success: true, data: result.data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao sincronizar acordos',
    };
  }
};

/**
 * Verificar consistência de um acordo
 */
export const verificarConsistenciaAcordo = async (
  acordoId: number
): Promise<MutationResult<VerificarConsistenciaResult>> => {
  try {
    const response = await fetch('/api/financeiro/obrigacoes/verificar-consistencia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acordoId }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return { success: false, error: result.error || 'Erro ao verificar consistência' };
    }

    return { success: true, data: result.data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao verificar consistência',
    };
  }
};
