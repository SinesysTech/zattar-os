
import { useState, useEffect, useCallback, useMemo } from 'react';
import { actionListarRepassesPendentes } from '../actions/repasses';
import { FiltrosRepasses, RepassePendente } from '../types';

export function useRepassesPendentes(filtros?: FiltrosRepasses) {
  const [data, setData] = useState<RepassePendente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize filtros stringified to avoid unnecessary re-renders
  const filtrosKey = useMemo(() => {
    return filtros ? JSON.stringify(filtros) : '';
  }, [filtros?.processoId, filtros?.status, filtros?.dataInicio, filtros?.dataFim]);

  const load = useCallback(async () => {
    setIsLoading(true);
    const result = await actionListarRepassesPendentes(filtros);
    if (result.success && result.data) {
      setData(result.data);
    } else {
      setError(result.error || 'Erro desconhecido');
    }
    setIsLoading(false);
  }, [filtros]);

  useEffect(() => {
    load();
  }, [load, filtrosKey]);

  return { data, isLoading, error, refetch: load };
}
