'use client';

/**
 * Hook para buscar e gerenciar salários
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  SalarioComDetalhes,
  ListarSalariosResponse,
  CriarSalarioDTO,
  AtualizarSalarioDTO,
  UsuarioResumo,
} from '@/backend/types/financeiro/salarios.types';

// ============================================================================
// Types
// ============================================================================

interface UseSalariosParams {
  pagina?: number;
  limite?: number;
  busca?: string;
  usuarioId?: number;
  cargoId?: number;
  ativo?: boolean;
  vigente?: boolean;
  ordenarPor?: 'data_inicio_vigencia' | 'salario_bruto' | 'usuario' | 'created_at';
  ordem?: 'asc' | 'desc';
  incluirTotais?: boolean;
  incluirSemSalario?: boolean;
}

interface UseSalariosResult {
  salarios: SalarioComDetalhes[];
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  } | null;
  totais: {
    totalFuncionarios: number;
    totalBrutoMensal: number;
  } | null;
  usuariosSemSalario: UsuarioResumo[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface SalarioApiResponse {
  success: boolean;
  data: ListarSalariosResponse & {
    totais?: { totalFuncionarios: number; totalBrutoMensal: number };
    usuariosSemSalario?: UsuarioResumo[];
  };
  error?: string;
}

// ============================================================================
// Hook Principal
// ============================================================================

/**
 * Hook para buscar salários com filtros e paginação
 */
export const useSalarios = (params: UseSalariosParams = {}): UseSalariosResult => {
  const [salarios, setSalarios] = useState<SalarioComDetalhes[]>([]);
  const [paginacao, setPaginacao] = useState<UseSalariosResult['paginacao']>(null);
  const [totais, setTotais] = useState<UseSalariosResult['totais']>(null);
  const [usuariosSemSalario, setUsuariosSemSalario] = useState<UsuarioResumo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buscarSalarios = useCallback(async () => {
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
      if (params.busca) {
        searchParams.set('busca', params.busca);
      }
      if (params.usuarioId !== undefined) {
        searchParams.set('usuarioId', params.usuarioId.toString());
      }
      if (params.cargoId !== undefined) {
        searchParams.set('cargoId', params.cargoId.toString());
      }
      if (params.ativo !== undefined) {
        searchParams.set('ativo', params.ativo.toString());
      }
      if (params.vigente !== undefined) {
        searchParams.set('vigente', params.vigente.toString());
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
      if (params.incluirSemSalario) {
        searchParams.set('incluirSemSalario', 'true');
      }

      const response = await fetch(`/api/rh/salarios?${searchParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data: SalarioApiResponse = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      setSalarios(data.data.items);
      setPaginacao(data.data.paginacao);
      setTotais(data.data.totais || null);
      setUsuariosSemSalario(data.data.usuariosSemSalario || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar salários';
      setError(errorMessage);
      setSalarios([]);
      setPaginacao(null);
      setTotais(null);
      setUsuariosSemSalario([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    params.pagina,
    params.limite,
    params.busca,
    params.usuarioId,
    params.cargoId,
    params.ativo,
    params.vigente,
    params.ordenarPor,
    params.ordem,
    params.incluirTotais,
    params.incluirSemSalario,
  ]);

  useEffect(() => {
    buscarSalarios();
  }, [buscarSalarios]);

  return {
    salarios,
    paginacao,
    totais,
    usuariosSemSalario,
    isLoading,
    error,
    refetch: buscarSalarios,
  };
};

// ============================================================================
// Hook para Salário Individual
// ============================================================================

interface UseSalarioResult {
  salario: SalarioComDetalhes | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar um salário específico por ID
 */
export const useSalario = (id: number | null): UseSalarioResult => {
  const [salario, setSalario] = useState<SalarioComDetalhes | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarSalario = useCallback(async () => {
    if (!id) {
      setSalario(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/rh/salarios/${id}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      setSalario(data.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar salário';
      setError(errorMessage);
      setSalario(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    buscarSalario();
  }, [buscarSalario]);

  return {
    salario,
    isLoading,
    error,
    refetch: buscarSalario,
  };
};

// ============================================================================
// Hook para Salários de um Usuário
// ============================================================================

interface UseSalariosDoUsuarioParams {
  usuarioId: number | null;
  vigente?: boolean;
  dataReferencia?: string;
}

interface UseSalariosDoUsuarioResult {
  salarios: SalarioComDetalhes[];
  salarioVigente: SalarioComDetalhes | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar salários de um usuário específico
 */
export const useSalariosDoUsuario = (params: UseSalariosDoUsuarioParams): UseSalariosDoUsuarioResult => {
  const [salarios, setSalarios] = useState<SalarioComDetalhes[]>([]);
  const [salarioVigente, setSalarioVigente] = useState<SalarioComDetalhes | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarSalariosDoUsuario = useCallback(async () => {
    if (!params.usuarioId) {
      setSalarios([]);
      setSalarioVigente(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();

      if (params.vigente !== undefined) {
        searchParams.set('vigente', params.vigente.toString());
      }
      if (params.dataReferencia) {
        searchParams.set('dataReferencia', params.dataReferencia);
      }

      const response = await fetch(
        `/api/rh/salarios/usuario/${params.usuarioId}?${searchParams.toString()}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          // Não tem salário, não é erro
          setSalarios([]);
          setSalarioVigente(null);
          return;
        }
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error('Resposta da API indicou falha');
      }

      if (params.vigente) {
        // Retornou salário único
        setSalarioVigente(data.data);
        setSalarios([data.data]);
      } else {
        // Retornou histórico
        setSalarios(data.data.items || []);
        // O primeiro é o mais recente (já ordenado por data desc)
        setSalarioVigente(data.data.items?.[0] || null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar salários do usuário';
      setError(errorMessage);
      setSalarios([]);
      setSalarioVigente(null);
    } finally {
      setIsLoading(false);
    }
  }, [params.usuarioId, params.vigente, params.dataReferencia]);

  useEffect(() => {
    buscarSalariosDoUsuario();
  }, [buscarSalariosDoUsuario]);

  return {
    salarios,
    salarioVigente,
    isLoading,
    error,
    refetch: buscarSalariosDoUsuario,
  };
};

// ============================================================================
// Mutation Functions
// ============================================================================

interface MutationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Criar novo salário
 */
export const criarSalario = async (dados: CriarSalarioDTO): Promise<MutationResult<SalarioComDetalhes>> => {
  try {
    const response = await fetch('/api/rh/salarios', {
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
        error: result.error || 'Erro ao criar salário',
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao criar salário',
    };
  }
};

/**
 * Atualizar salário existente
 */
export const atualizarSalario = async (
  id: number,
  dados: AtualizarSalarioDTO
): Promise<MutationResult<SalarioComDetalhes>> => {
  try {
    const response = await fetch(`/api/rh/salarios/${id}`, {
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
        error: result.error || 'Erro ao atualizar salário',
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao atualizar salário',
    };
  }
};

/**
 * Encerrar vigência de um salário
 */
export const encerrarVigenciaSalario = async (
  id: number,
  dataFim: string
): Promise<MutationResult<SalarioComDetalhes>> => {
  try {
    const response = await fetch(`/api/rh/salarios/${id}?modo=encerrar&dataFim=${dataFim}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Erro ao encerrar vigência',
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao encerrar vigência',
    };
  }
};

/**
 * Inativar salário
 */
export const inativarSalario = async (id: number): Promise<MutationResult<SalarioComDetalhes>> => {
  try {
    const response = await fetch(`/api/rh/salarios/${id}?modo=inativar`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Erro ao inativar salário',
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao inativar salário',
    };
  }
};

/**
 * Excluir salário (hard delete)
 */
export const excluirSalario = async (id: number): Promise<MutationResult> => {
  try {
    const response = await fetch(`/api/rh/salarios/${id}?modo=excluir`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Erro ao excluir salário',
      };
    }

    return {
      success: true,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao excluir salário',
    };
  }
};
