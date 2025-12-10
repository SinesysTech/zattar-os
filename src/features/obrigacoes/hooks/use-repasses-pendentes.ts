
import { useState, useEffect } from 'react';
import { actionListarRepassesPendentes } from '../actions/repasses';
import { FiltrosRepasses, RepassePendente } from '../types';

export function useRepassesPendentes(filtros?: FiltrosRepasses) {
  const [data, setData] = useState<RepassePendente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    const result = await actionListarRepassesPendentes(filtros);
    if (result.success && result.data) {
      setData(result.data);
    } else {
      setError(result.error || 'Erro desconhecido');
    }
    setIsLoading(false);
  }

  useEffect(() => {
    load();
  }, [JSON.stringify(filtros)]);

  return { data, isLoading, error, refetch: load };
}
