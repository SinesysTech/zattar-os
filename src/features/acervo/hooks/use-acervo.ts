/**
 * React Hooks for Acervo Feature
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  actionListarAcervo,
  actionBuscarProcesso,
  actionAtribuirResponsavel,
  actionBuscarProcessosClientePorCpf,
} from '../actions/acervo-actions';
import type {
  ListarAcervoParams,
  ListarAcervoResult,
  Acervo,
  ProcessosClienteCpfResponse,
} from '../types';

/**
 * Hook for listing acervo with filters and pagination
 */
export function useAcervo(initialParams: ListarAcervoParams = {}) {
  const [data, setData] = useState<ListarAcervoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<ListarAcervoParams>(initialParams);
  const { toast } = useToast();

  const fetchAcervo = useCallback(async (fetchParams?: ListarAcervoParams) => {
    setLoading(true);
    setError(null);

    try {
      const result = await actionListarAcervo(fetchParams || params);

      if (result.success && result.data) {
        setData(result.data as ListarAcervoResult);
      } else {
        setError(result.error || 'Erro ao carregar acervo');
        toast({
          title: 'Erro',
          description: result.error || 'Erro ao carregar acervo',
          variant: 'destructive',
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [params, toast]);

  useEffect(() => {
    fetchAcervo();
  }, [fetchAcervo]);

  const updateParams = useCallback((newParams: Partial<ListarAcervoParams>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  const refetch = useCallback(() => {
    fetchAcervo(params);
  }, [fetchAcervo, params]);

  return {
    data,
    loading,
    error,
    params,
    updateParams,
    refetch,
  };
}

/**
 * Hook for fetching a single process by ID
 */
export function useProcesso(id: number | null) {
  const [processo, setProcesso] = useState<Acervo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProcesso = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const result = await actionBuscarProcesso(id);

      if (result.success && result.data) {
        setProcesso(result.data as Acervo);
      } else {
        setError(result.error || 'Erro ao carregar processo');
        toast({
          title: 'Erro',
          description: result.error || 'Erro ao carregar processo',
          variant: 'destructive',
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchProcesso();
  }, [fetchProcesso]);

  return {
    processo,
    loading,
    error,
    refetch: fetchProcesso,
  };
}

/**
 * Hook for assigning responsible to processes
 */
export function useAtribuirResponsavel() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const atribuir = useCallback(async (
    processoIds: number[],
    responsavelId: number | null
  ) => {
    setLoading(true);

    try {
      const result = await actionAtribuirResponsavel(processoIds, responsavelId);

      if (result.success) {
        toast({
          title: 'Sucesso',
          description: 'Responsável atribuído com sucesso',
        });
        return true;
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Erro ao atribuir responsável',
          variant: 'destructive',
        });
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    atribuir,
    loading,
  };
}

/**
 * Hook for searching processes by client CPF (for AI Agent)
 */
export function useProcessosClienteCpf() {
  const [data, setData] = useState<ProcessosClienteCpfResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const buscar = useCallback(async (cpf: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await actionBuscarProcessosClientePorCpf(cpf);

      if (result.success) {
        setData(result as ProcessosClienteCpfResponse);
      } else {
        setError(result.error || 'Erro ao buscar processos');
        setData({ success: false, error: result.error || 'Erro ao buscar processos' });
        toast({
          title: 'Erro',
          description: result.error || 'Erro ao buscar processos',
          variant: 'destructive',
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      setData({ success: false, error: errorMessage });
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    data,
    loading,
    error,
    buscar,
  };
}

/**
 * Hook for acervo filters state management
 */
export function useAcervoFilters(initialFilters: ListarAcervoParams = {}) {
  const [filters, setFilters] = useState<ListarAcervoParams>(initialFilters);

  const updateFilter = useCallback(<K extends keyof ListarAcervoParams>(
    key: K,
    value: ListarAcervoParams[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const clearFilter = useCallback((key: keyof ListarAcervoParams) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  return {
    filters,
    updateFilter,
    resetFilters,
    clearFilter,
    setFilters,
  };
}
