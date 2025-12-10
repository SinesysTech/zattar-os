'use client';

import { useState, useCallback, useTransition, useEffect } from 'react';
import { Assistente, AssistentesParams, PaginacaoResult } from '../types';
import { actionListarAssistentes } from '../actions/assistentes-actions';
import { useDebounce } from '@/hooks/use-debounce'; // Assuming this exists, if not I'll just use setTimeout or import from somewhere else

export function useAssistentes(initialParams: AssistentesParams = {}) {
  const [assistentes, setAssistentes] = useState<Assistente[]>([]);
  const [paginacao, setPaginacao] = useState<PaginacaoResult<Assistente>['paginacao']>({
    total: 0,
    pagina: 1,
    limite: 50,
    totalPaginas: 0,
  });
  const [isLoading, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  const [params, setParams] = useState<AssistentesParams>(initialParams);
  const debouncedBusca = useDebounce(params.busca, 500);

  const fetchAssistentes = useCallback(async (fetchParams: AssistentesParams) => {
    startTransition(async () => {
      setError(null);
      const result = await actionListarAssistentes(fetchParams);
      if (result.success && result.data) {
        setAssistentes(result.data.data);
        const { data, ...paginacaoData } = result.data;
        setPaginacao(paginacaoData as any);
      } else {
        setError(result.error || 'Erro ao carregar assistentes');
      }
    });
  }, []);

  // Update when params change
  useEffect(() => {
    // Only fetch if params changed. 
    // We need to handle the debounce for 'busca'.
    // If 'busca' changed in params but is not equal to debouncedBusca, waiting.
    if (params.busca !== undefined && params.busca !== debouncedBusca) {
      return;
    }
    
    fetchAssistentes({ ...params, busca: debouncedBusca });
  }, [params, debouncedBusca, fetchAssistentes]);

  // Exposed methods to update filters/pagination
  const setPagina = (pagina: number) => setParams(prev => ({ ...prev, pagina }));
  const setBusca = (busca: string) => setParams(prev => ({ ...prev, busca, pagina: 1 }));
  const setFiltros = (filtros: Partial<AssistentesParams>) => setParams(prev => ({ ...prev, ...filtros, pagina: 1 }));

  return {
    assistentes,
    paginacao,
    isLoading,
    error,
    params,
    setPagina,
    setBusca,
    setFiltros,
    refetch: () => fetchAssistentes(params),
  };
}
