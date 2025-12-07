'use client';

/**
 * Hooks para buscar e gerenciar orçamentos empresariais
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  OrcamentoComDetalhes,
  OrcamentoComItens,
  OrcamentoItem,
  ListarOrcamentosParams,
  ListarOrcamentosResponse,
  StatusOrcamento,
  PeriodoOrcamento,
  AnaliseOrcamentariaItem,
  ResumoOrcamentario,
  AlertaDesvio,
  EvolucaoMensal,
  ProjecaoItem,
  CriarOrcamentoDTO,
  AtualizarOrcamentoDTO,
  CriarOrcamentoItemDTO,
  AtualizarOrcamentoItemDTO,
} from '@/backend/types/financeiro/orcamento.types';

// ============================================================================
// Types
// ============================================================================

interface UseOrcamentosParams {
  pagina?: number;
  limite?: number;
  busca?: string;
  ano?: number;
  periodo?: PeriodoOrcamento;
  status?: StatusOrcamento | StatusOrcamento[];
  ordenarPor?: 'nome' | 'ano' | 'periodo' | 'status' | 'data_inicio' | 'created_at';
  ordem?: 'asc' | 'desc';
}

interface UseOrcamentosResult {
  orcamentos: OrcamentoComDetalhes[];
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  } | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface OrcamentosApiResponse {
  success: boolean;
  data: ListarOrcamentosResponse;
  error?: string;
}

// ============================================================================
// Hook Principal - Lista de Orçamentos
// ============================================================================

/**
 * Hook para buscar orçamentos com filtros e paginação
 */
export const useOrcamentos = (params: UseOrcamentosParams = {}): UseOrcamentosResult => {
  const [orcamentos, setOrcamentos] = useState<OrcamentoComDetalhes[]>([]);
  const [paginacao, setPaginacao] = useState<UseOrcamentosResult['paginacao']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscarOrcamentos = useCallback(async () => {
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
      if (params.ano !== undefined) {
        searchParams.set('ano', params.ano.toString());
      }
      if (params.periodo) {
        searchParams.set('periodo', params.periodo);
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

      const response = await fetch(`/api/financeiro/orcamentos?${searchParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data: OrcamentosApiResponse = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      setOrcamentos(data.data.items);
      setPaginacao(data.data.paginacao);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar orçamentos';
      setError(errorMessage);
      setOrcamentos([]);
      setPaginacao(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    params.pagina,
    params.limite,
    params.busca,
    params.ano,
    params.periodo,
    params.status,
    params.ordenarPor,
    params.ordem,
  ]);

  useEffect(() => {
    buscarOrcamentos();
  }, [buscarOrcamentos]);

  return {
    orcamentos,
    paginacao,
    isLoading,
    error,
    refetch: buscarOrcamentos,
  };
};

// ============================================================================
// Hook para Orçamento Individual
// ============================================================================

interface UseOrcamentoResult {
  orcamento: OrcamentoComDetalhes | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar um orçamento específico por ID com detalhes completos
 */
export const useOrcamento = (id: number | null): UseOrcamentoResult => {
  const [orcamento, setOrcamento] = useState<OrcamentoComDetalhes | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarOrcamento = useCallback(async () => {
    if (!id) {
      setOrcamento(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/financeiro/orcamentos/${id}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      setOrcamento(data.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar orçamento';
      setError(errorMessage);
      setOrcamento(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      buscarOrcamento();
    }
  }, [id, buscarOrcamento]);

  return {
    orcamento,
    isLoading,
    error,
    refetch: buscarOrcamento,
  };
};

// ============================================================================
// Hook para Análise Orçamentária
// ============================================================================

interface UseAnaliseOrcamentariaParams {
  incluirResumo?: boolean;
  incluirAlertas?: boolean;
  incluirEvolucao?: boolean;
}

interface UseAnaliseOrcamentariaResult {
  itens: AnaliseOrcamentariaItem[];
  resumo: ResumoOrcamentario | null;
  alertas: AlertaDesvio[];
  evolucao: EvolucaoMensal[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar análise orçamentária de um orçamento
 */
export const useAnaliseOrcamentaria = (
  orcamentoId: number | null,
  params: UseAnaliseOrcamentariaParams = {}
): UseAnaliseOrcamentariaResult => {
  const [itens, setItens] = useState<AnaliseOrcamentariaItem[]>([]);
  const [resumo, setResumo] = useState<ResumoOrcamentario | null>(null);
  const [alertas, setAlertas] = useState<AlertaDesvio[]>([]);
  const [evolucao, setEvolucao] = useState<EvolucaoMensal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    incluirResumo = true,
    incluirAlertas = true,
    incluirEvolucao = false,
  } = params;

  const buscarAnalise = useCallback(async () => {
    if (!orcamentoId) {
      setItens([]);
      setResumo(null);
      setAlertas([]);
      setEvolucao([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();
      searchParams.set('incluirResumo', incluirResumo.toString());
      searchParams.set('incluirAlertas', incluirAlertas.toString());
      searchParams.set('incluirEvolucao', incluirEvolucao.toString());

      const response = await fetch(
        `/api/financeiro/orcamentos/${orcamentoId}/analise?${searchParams.toString()}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      setItens(data.data.itens || []);
      setResumo(data.data.resumo || null);
      setAlertas(data.data.alertas || []);
      setEvolucao(data.data.evolucao || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar análise';
      setError(errorMessage);
      setItens([]);
      setResumo(null);
      setAlertas([]);
      setEvolucao([]);
    } finally {
      setIsLoading(false);
    }
  }, [orcamentoId, incluirResumo, incluirAlertas, incluirEvolucao]);

  useEffect(() => {
    if (orcamentoId) {
      buscarAnalise();
    }
  }, [orcamentoId, buscarAnalise]);

  return {
    itens,
    resumo,
    alertas,
    evolucao,
    isLoading,
    error,
    refetch: buscarAnalise,
  };
};

// ============================================================================
// Hook para Projeção Orçamentária
// ============================================================================

interface UseProjecaoOrcamentariaResult {
  projecao: ProjecaoItem[];
  comparativoAnual: Record<string, unknown> | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar projeção orçamentária
 */
export const useProjecaoOrcamentaria = (
  orcamentoId: number | null,
  incluirComparativoAnual: boolean = false
): UseProjecaoOrcamentariaResult => {
  const [projecao, setProjecao] = useState<ProjecaoItem[]>([]);
  const [comparativoAnual, setComparativoAnual] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarProjecao = useCallback(async () => {
    if (!orcamentoId) {
      setProjecao([]);
      setComparativoAnual(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();
      if (incluirComparativoAnual) {
        searchParams.set('incluirComparativoAnual', 'true');
      }

      const response = await fetch(
        `/api/financeiro/orcamentos/${orcamentoId}/projecao?${searchParams.toString()}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      setProjecao(data.data.projecao || []);
      setComparativoAnual(data.data.comparativoAnual || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar projeção';
      setError(errorMessage);
      setProjecao([]);
      setComparativoAnual(null);
    } finally {
      setIsLoading(false);
    }
  }, [orcamentoId, incluirComparativoAnual]);

  useEffect(() => {
    if (orcamentoId) {
      buscarProjecao();
    }
  }, [orcamentoId, buscarProjecao]);

  return {
    projecao,
    comparativoAnual,
    isLoading,
    error,
    refetch: buscarProjecao,
  };
};

// ============================================================================
// Hook para Itens do Orçamento
// ============================================================================

interface UseOrcamentoItensResult {
  itens: OrcamentoItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar itens de um orçamento
 */
export const useOrcamentoItens = (orcamentoId: number | null): UseOrcamentoItensResult => {
  const [itens, setItens] = useState<OrcamentoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarItens = useCallback(async () => {
    if (!orcamentoId) {
      setItens([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/financeiro/orcamentos/${orcamentoId}/itens`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      setItens(data.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar itens';
      setError(errorMessage);
      setItens([]);
    } finally {
      setIsLoading(false);
    }
  }, [orcamentoId]);

  useEffect(() => {
    if (orcamentoId) {
      buscarItens();
    }
  }, [orcamentoId, buscarItens]);

  return {
    itens,
    isLoading,
    error,
    refetch: buscarItens,
  };
};

// ============================================================================
// Hook para Relatório do Orçamento
// ============================================================================

interface UseRelatorioOrcamentoResult {
  relatorio: {
    orcamento: OrcamentoComDetalhes;
    analise: {
      itens: AnaliseOrcamentariaItem[];
      resumo: ResumoOrcamentario | null;
      alertas: AlertaDesvio[];
      evolucao: EvolucaoMensal[];
      projecao: ProjecaoItem[];
    };
    geradoEm: string;
  } | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar relatório completo do orçamento
 */
export const useRelatorioOrcamento = (orcamentoId: number | null): UseRelatorioOrcamentoResult => {
  const [relatorio, setRelatorio] = useState<UseRelatorioOrcamentoResult['relatorio']>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarRelatorio = useCallback(async () => {
    if (!orcamentoId) {
      setRelatorio(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/financeiro/orcamentos/${orcamentoId}/relatorio`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      setRelatorio(data.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar relatório';
      setError(errorMessage);
      setRelatorio(null);
    } finally {
      setIsLoading(false);
    }
  }, [orcamentoId]);

  useEffect(() => {
    if (orcamentoId) {
      buscarRelatorio();
    }
  }, [orcamentoId, buscarRelatorio]);

  return {
    relatorio,
    isLoading,
    error,
    refetch: buscarRelatorio,
  };
};

// ============================================================================
// Funções de Mutação (criar, atualizar, aprovar, etc.)
// ============================================================================

interface MutationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Criar novo orçamento
 */
export const criarOrcamento = async (
  dados: CriarOrcamentoDTO
): Promise<MutationResult<OrcamentoComItens>> => {
  try {
    const response = await fetch('/api/financeiro/orcamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return { success: false, error: result.error || 'Erro ao criar orçamento' };
    }

    return { success: true, data: result.data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao criar orçamento',
    };
  }
};

/**
 * Atualizar orçamento existente
 */
export const atualizarOrcamento = async (
  id: number,
  dados: AtualizarOrcamentoDTO
): Promise<MutationResult<OrcamentoComItens>> => {
  try {
    const response = await fetch(`/api/financeiro/orcamentos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return { success: false, error: result.error || 'Erro ao atualizar orçamento' };
    }

    return { success: true, data: result.data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao atualizar orçamento',
    };
  }
};

/**
 * Aprovar orçamento
 */
export const aprovarOrcamento = async (
  id: number,
  observacoes?: string
): Promise<MutationResult<OrcamentoComItens>> => {
  try {
    const response = await fetch(`/api/financeiro/orcamentos/${id}/aprovar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ observacoes }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return { success: false, error: result.error || 'Erro ao aprovar orçamento' };
    }

    return { success: true, data: result.data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao aprovar orçamento',
    };
  }
};

/**
 * Iniciar execução do orçamento
 */
export const iniciarExecucaoOrcamento = async (
  id: number
): Promise<MutationResult<OrcamentoComItens>> => {
  try {
    const response = await fetch(`/api/financeiro/orcamentos/${id}/iniciar-execucao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return { success: false, error: result.error || 'Erro ao iniciar execução' };
    }

    return { success: true, data: result.data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao iniciar execução',
    };
  }
};

/**
 * Encerrar orçamento
 */
export const encerrarOrcamento = async (
  id: number,
  observacoes?: string
): Promise<MutationResult<OrcamentoComItens>> => {
  try {
    const response = await fetch(`/api/financeiro/orcamentos/${id}/encerrar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ observacoes }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return { success: false, error: result.error || 'Erro ao encerrar orçamento' };
    }

    return { success: true, data: result.data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao encerrar orçamento',
    };
  }
};

/**
 * Excluir orçamento
 */
export const excluirOrcamento = async (id: number): Promise<MutationResult> => {
  try {
    const response = await fetch(`/api/financeiro/orcamentos/${id}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return { success: false, error: result.error || 'Erro ao excluir orçamento' };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao excluir orçamento',
    };
  }
};

// ============================================================================
// Funções de Mutação para Itens
// ============================================================================

/**
 * Criar item do orçamento
 */
export const criarItemOrcamento = async (
  orcamentoId: number,
  dados: Omit<CriarOrcamentoItemDTO, 'orcamentoId'>
): Promise<MutationResult<OrcamentoItem>> => {
  try {
    const response = await fetch(`/api/financeiro/orcamentos/${orcamentoId}/itens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return { success: false, error: result.error || 'Erro ao criar item' };
    }

    return { success: true, data: result.data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao criar item',
    };
  }
};

/**
 * Criar itens em lote
 */
export const criarItensOrcamentoEmLote = async (
  orcamentoId: number,
  itens: Omit<CriarOrcamentoItemDTO, 'orcamentoId'>[]
): Promise<MutationResult<OrcamentoItem[]>> => {
  try {
    const response = await fetch(`/api/financeiro/orcamentos/${orcamentoId}/itens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itens }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return { success: false, error: result.error || 'Erro ao criar itens' };
    }

    return { success: true, data: result.data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao criar itens',
    };
  }
};

/**
 * Atualizar item do orçamento
 */
export const atualizarItemOrcamento = async (
  orcamentoId: number,
  itemId: number,
  dados: AtualizarOrcamentoItemDTO
): Promise<MutationResult<OrcamentoItem>> => {
  try {
    const response = await fetch(`/api/financeiro/orcamentos/${orcamentoId}/itens/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return { success: false, error: result.error || 'Erro ao atualizar item' };
    }

    return { success: true, data: result.data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao atualizar item',
    };
  }
};

/**
 * Excluir item do orçamento
 */
export const excluirItemOrcamento = async (
  orcamentoId: number,
  itemId: number
): Promise<MutationResult> => {
  try {
    const response = await fetch(`/api/financeiro/orcamentos/${orcamentoId}/itens/${itemId}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return { success: false, error: result.error || 'Erro ao excluir item' };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao excluir item',
    };
  }
};

// ============================================================================
// Hook de Relatório para Exportação
// ============================================================================

interface ExportarRelatorioParams {
  orcamentoId: number;
  formato: 'excel' | 'pdf';
}

/**
 * Função para exportar relatório do orçamento
 */
export const exportarRelatorioOrcamento = async (
  params: ExportarRelatorioParams
): Promise<MutationResult<{ url?: string; blob?: Blob }>> => {
  try {
    const response = await fetch(
      `/api/financeiro/orcamentos/${params.orcamentoId}/relatorio?formato=${params.formato}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      return { success: false, error: errorData.error || 'Erro ao exportar relatório' };
    }

    const data = await response.json();

    if (!data.success) {
      return { success: false, error: 'Erro ao gerar relatório' };
    }

    // Retornar dados para processamento no frontend
    return { success: true, data: data.data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao exportar relatório',
    };
  }
};
