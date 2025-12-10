import { useState, useEffect, useCallback } from 'react';

interface TipoAudiencia {
  id: number;
  descricao: string;
  codigo?: string;
  isVirtual?: boolean;
}

interface UseTiposAudienciasResult {
  tiposAudiencia: TipoAudiencia[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTiposAudiencias(params?: { trt?: string; grau?: string; limite?: number }): UseTiposAudienciasResult {
  const [tiposAudiencia, setTiposAudiencia] = useState<TipoAudiencia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Construct query parameters
      const queryParams = new URLSearchParams();
      if (params?.trt) queryParams.append('trt', params.trt);
      if (params?.grau) queryParams.append('grau', params.grau);
      if (params?.limite) queryParams.append('limite', params.limite.toString());

      const url = `/api/audiencias/tipos?${queryParams.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTiposAudiencia(data.data || []); // Assuming the API returns { success: true, data: [...] }
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar tipos de audiência.');
      setTiposAudiencia([]);
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { tiposAudiencia, isLoading, error, refetch };
}
