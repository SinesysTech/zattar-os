import { useState, useEffect, useCallback } from 'react';
import { Audiencia, ListarAudienciasParams } from '@/core/audiencias/domain';
import { ActionResult, actionListarAudiencias } from '@/core/app/actions/audiencias';
import { PaginatedResponse } from '@/core/types';
import { useDebounce } from './use-debounce'; // Assuming a useDebounce hook exists

interface UseAudienciasResult {
  audiencias: Audiencia[];
  paginacao: PaginatedResponse<Audiencia>['pagination'] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAudiencias(params: ListarAudienciasParams): UseAudienciasResult {
  const [audiencias, setAudiencias] = useState<Audiencia[]>([]);
  const [paginacao, setPaginacao] = useState<PaginatedResponse<Audiencia>['pagination'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedParams = useDebounce(params, 300); // Debounce params to avoid excessive API calls

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result: ActionResult<PaginatedResponse<Audiencia>> = await actionListarAudiencias(debouncedParams);

    if (result.success) {
      setAudiencias(result.data.data);
      setPaginacao(result.data.pagination);
    } else {
      setError(result.error);
      setAudiencias([]);
      setPaginacao(null);
    }
    setIsLoading(false);
  }, [debouncedParams]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { audiencias, paginacao, isLoading, error, refetch };
}
