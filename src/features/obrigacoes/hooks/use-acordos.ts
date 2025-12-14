'use client';

import { useState, useEffect, useCallback, startTransition } from 'react';
import { actionListarAcordos } from '../actions/acordos';
import { AcordoComParcelas, ListarAcordosParams } from '../types';

export function useAcordos(filtros: ListarAcordosParams) {
  const [data, setData] = useState<AcordoComParcelas[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    startTransition(() => {
      setIsLoading(true);
    });
    
    const result = await actionListarAcordos(filtros);
    
    startTransition(() => {
      if (result.success && result.data) {
        setData(result.data.acordos);
        setTotal(result.data.total);
        setTotalPaginas(result.data.totalPaginas);
      } else {
        setError(result.error || 'Erro desconhecido');
      }
      setIsLoading(false);
    });
  }, [filtros]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, total, totalPaginas, isLoading, error, refetch: load };
}
