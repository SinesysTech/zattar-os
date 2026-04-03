'use client';

/**
 * Hook para Orçamentos
 * Usa Server Actions de features/financeiro/actions/orcamentos
 */

import { useState, useCallback, useEffect } from 'react';
import useSWR from 'swr';
import {
    actionListarOrcamentos,
    actionBuscarOrcamento,
    actionCriarOrcamento,
    actionAtualizarOrcamento,
    actionExcluirOrcamento,
    actionExcluirItemOrcamento,
    actionCriarItemOrcamento,
    actionAtualizarItemOrcamento,
    actionAprovarOrcamento,
    actionIniciarExecucaoOrcamento,
    actionEncerrarOrcamento,
    actionObterAnaliseOrcamentaria,
    actionObterProjecaoOrcamentaria,
    type ListarOrcamentosFilters,
    type AnaliseOrcamentariaUI,
} from '../actions/orcamentos';
import type {
    OrcamentoComItens,
    CriarOrcamentoDTO,
    AtualizarOrcamentoDTO,
    CriarOrcamentoItemDTO,
    AtualizarOrcamentoItemDTO,
} from '../domain/orcamentos';

interface UseOrcamentosOptions {
    autoFetch?: boolean;
    filters?: ListarOrcamentosFilters;
}

interface UseOrcamentosReturn {
    orcamentos: OrcamentoComItens[];
    orcamentoSelecionado: OrcamentoComItens | null;
    analise: AnaliseOrcamentariaUI | null;
    isLoading: boolean;
    error: string | null;
    total: number;
    listar: (filters?: ListarOrcamentosFilters) => Promise<void>;
    buscar: (id: number) => Promise<void>;
    criar: (dto: CriarOrcamentoDTO, usuarioId: string) => Promise<boolean>;
    atualizar: (id: number, dto: AtualizarOrcamentoDTO) => Promise<boolean>;
    excluir: (id: number) => Promise<boolean>;
    aprovar: (id: number, usuarioId: string, observacoes?: string) => Promise<boolean>;
    iniciarExecucao: (id: number, usuarioId: string) => Promise<boolean>;
    encerrar: (id: number, usuarioId: string, observacoes?: string) => Promise<boolean>;
    obterAnalise: (orcamentoId: number) => Promise<void>;
    refetch: () => Promise<void>;
}

export function useOrcamentos(options?: UseOrcamentosOptions): UseOrcamentosReturn {
    const [orcamentos, setOrcamentos] = useState<OrcamentoComItens[]>([]);
    const [orcamentoSelecionado, setOrcamentoSelecionado] = useState<OrcamentoComItens | null>(null);
    const [analise, setAnalise] = useState<AnaliseOrcamentariaUI | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [total, setTotal] = useState(0);
    const [currentFilters, setCurrentFilters] = useState<ListarOrcamentosFilters | undefined>(options?.filters);

    const listar = useCallback(async (filters?: ListarOrcamentosFilters) => {
        setIsLoading(true);
        setError(null);
        try {
            const filtersToUse = filters || currentFilters;
            setCurrentFilters(filtersToUse);
            const result = await actionListarOrcamentos(filtersToUse);
            if (result.success && result.data) {
                setOrcamentos(result.data.items || []);
                setTotal(result.data.total || 0);
            } else if (!result.success) {
                setError(result.error || 'Erro ao listar orçamentos');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setIsLoading(false);
        }
    }, [currentFilters]);

    const buscar = useCallback(async (id: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await actionBuscarOrcamento(id);
            if (result.success && result.data) {
                setOrcamentoSelecionado(result.data);
            } else {
                setError(result.error || 'Erro ao buscar orçamento');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const criar = useCallback(async (dto: CriarOrcamentoDTO, usuarioId: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await actionCriarOrcamento(dto, usuarioId);
            if (result.success) {
                await listar();
                return true;
            } else {
                setError(result.error || 'Erro ao criar orçamento');
                return false;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [listar]);

    const atualizar = useCallback(async (id: number, dto: AtualizarOrcamentoDTO): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await actionAtualizarOrcamento(id, dto);
            if (result.success) {
                await listar();
                return true;
            } else {
                setError(result.error || 'Erro ao atualizar orçamento');
                return false;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [listar]);

    const excluir = useCallback(async (id: number): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await actionExcluirOrcamento(id);
            if (result.success) {
                await listar();
                return true;
            } else {
                setError(result.error || 'Erro ao excluir orçamento');
                return false;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [listar]);

    const aprovar = useCallback(async (id: number, usuarioId: string, observacoes?: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await actionAprovarOrcamento(id, usuarioId, observacoes);
            if (result.success) {
                await listar();
                return true;
            } else {
                setError(result.error || 'Erro ao aprovar orçamento');
                return false;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [listar]);

    const iniciarExecucao = useCallback(async (id: number, usuarioId: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await actionIniciarExecucaoOrcamento(id, usuarioId);
            if (result.success) {
                await listar();
                return true;
            } else {
                setError(result.error || 'Erro ao iniciar execução');
                return false;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [listar]);

    const encerrar = useCallback(async (id: number, usuarioId: string, observacoes?: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await actionEncerrarOrcamento(id, usuarioId, observacoes);
            if (result.success) {
                await listar();
                return true;
            } else {
                setError(result.error || 'Erro ao encerrar orçamento');
                return false;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [listar]);

    const obterAnalise = useCallback(async (orcamentoId: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await actionObterAnaliseOrcamentaria(orcamentoId);
            if (result.success && result.data) {
                setAnalise(result.data);
            } else if (!result.success) {
                setError(result.error || 'Erro ao obter análise');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const refetch = useCallback(async () => {
        await listar(currentFilters);
    }, [listar, currentFilters]);

    // Auto-fetch na montagem se configurado
    useEffect(() => {
        if (options?.autoFetch) {
            listar(options.filters);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options?.autoFetch]);

    return {
        orcamentos,
        orcamentoSelecionado,
        analise,
        isLoading,
        error,
        total,
        listar,
        buscar,
        criar,
        atualizar,
        excluir,
        aprovar,
        iniciarExecucao,
        encerrar,
        obterAnalise,
        refetch,
    };
}

// ============================================================================
// Funções Standalone para Compatibilidade
// ============================================================================

interface MutationResult {
    success: boolean;
    error?: string;
}

/**
 * Aprovar orçamento (função standalone)
 */
export async function aprovarOrcamento(id: number): Promise<MutationResult> {
    try {
        // Usar usuário atual - em produção isso viria do contexto de auth
        const result = await actionAprovarOrcamento(id, 'sistema');
        return { success: result.success, error: result.error };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

/**
 * Iniciar execução de orçamento (função standalone)
 */
export async function iniciarExecucaoOrcamento(id: number): Promise<MutationResult> {
    try {
        const result = await actionIniciarExecucaoOrcamento(id, 'sistema');
        return { success: result.success, error: result.error };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

/**
 * Encerrar orçamento (função standalone)
 */
export async function encerrarOrcamento(id: number): Promise<MutationResult> {
    try {
        const result = await actionEncerrarOrcamento(id, 'sistema');
        return { success: result.success, error: result.error };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

/**
 * Excluir orçamento (função standalone)
 */
export async function excluirOrcamento(id: number): Promise<MutationResult> {
    try {
        const result = await actionExcluirOrcamento(id);
        return { success: result.success, error: result.error };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

/**
 * Excluir item do orçamento (função standalone)
 */
export async function excluirItemOrcamento(orcamentoId: number, itemId: number): Promise<MutationResult> {
    try {
        const result = await actionExcluirItemOrcamento(orcamentoId, itemId);
        return { success: result.success, error: result.error };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

/**
 * Criar item do orçamento (função standalone)
 */
export async function criarItemOrcamento(
    orcamentoId: number,
    dto: CriarOrcamentoItemDTO
): Promise<{ success: boolean; error?: string }> {
    try {
        const result = await actionCriarItemOrcamento(orcamentoId, dto);
        return { success: result.success, error: result.success ? undefined : result.error };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

/**
 * Atualizar item do orçamento (função standalone)
 */
export async function atualizarItemOrcamento(
    orcamentoId: number,
    itemId: number,
    dto: AtualizarOrcamentoItemDTO
): Promise<{ success: boolean; error?: string }> {
    try {
        const result = await actionAtualizarItemOrcamento(orcamentoId, itemId, dto);
        return { success: result.success, error: result.success ? undefined : result.error };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
}

// ============================================================================
// Hooks adicionais esperados pelas páginas (compatibilidade)
// ============================================================================

export function useOrcamento(orcamentoId: number) {
    const key = orcamentoId ? ['orcamento', orcamentoId] : null;

    const fetcher = async () => {
        const result = await actionBuscarOrcamento(orcamentoId);
        if (!result.success) throw new Error(result.error);
        return result.data;
    };

    const { data, error, isLoading, mutate } = useSWR(key, fetcher);

    return {
        orcamento: data ?? null,
        isLoading,
        error: error ? (error instanceof Error ? error.message : 'Erro ao carregar') : null,
        refetch: mutate,
    };
}

export function useAnaliseOrcamentaria(
    orcamentoId: number,
    options?: { incluirResumo?: boolean; incluirAlertas?: boolean; incluirEvolucao?: boolean }
) {
    const key = orcamentoId ? ['orcamento-analise', orcamentoId, JSON.stringify(options ?? {})] : null;

    const fetcher = async () => {
        const result = await actionObterAnaliseOrcamentaria(orcamentoId, options);
        if (!result.success) throw new Error(result.error);
        return result.data;
    };

    const { data, error, isLoading, mutate } = useSWR(key, fetcher);

    return {
        itens: data?.itens ?? [],
        resumo: data?.resumo ?? null,
        alertas: data?.alertas ?? null,
        evolucao: data?.evolucao ?? null,
        isLoading,
        error: error ? (error instanceof Error ? error.message : 'Erro ao carregar') : null,
        refetch: mutate,
    };
}

export function useProjecaoOrcamentaria(orcamentoId: number) {
    const key = orcamentoId ? ['orcamento-projecao', orcamentoId] : null;

    const fetcher = async () => {
        const result = await actionObterProjecaoOrcamentaria(orcamentoId);
        if (!result.success) throw new Error(result.error);
        return result.data;
    };

    const { data, error, isLoading, mutate } = useSWR(key, fetcher);

    return {
        projecao: data?.projecao ?? [],
        resumo: data?.resumo ?? null,
        isLoading,
        error: error ? (error instanceof Error ? error.message : 'Erro ao carregar') : null,
        refetch: mutate,
    };
}
