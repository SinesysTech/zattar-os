'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface AdvogadoOption {
  value: string;
  label: string;
}

interface UseAdvogadosMapResult {
  advogadosMap: Map<number, string>;
  advogadoOptions: AdvogadoOption[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook leve para buscar advogados e montar:
 * - advogadosMap: id → nome_completo (para colunas da tabela)
 * - advogadoOptions: {value, label}[] (para filtros)
 *
 * Usa fetch() (Route Handler) em vez de Server Action para permitir
 * paralelismo real com outros fetches do componente.
 */
export const useAdvogadosMap = (): UseAdvogadosMapResult => {
  const [advogadosMap, setAdvogadosMap] = useState<Map<number, string>>(() => new Map());
  const [advogadoOptions, setAdvogadoOptions] = useState<AdvogadoOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const buscar = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/advogados/mapa');

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();

      if (!json.success) {
        throw new Error('Resposta da API indicou falha');
      }

      const map = new Map<number, string>();
      const options: AdvogadoOption[] = [];

      for (const item of json.data) {
        map.set(item.id, item.nome_completo);
        options.push({ value: item.id.toString(), label: item.nome_completo });
      }

      setAdvogadosMap(map);
      setAdvogadoOptions(options);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar advogados');
      setAdvogadosMap(new Map());
      setAdvogadoOptions([]);
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    buscar();
  }, [buscar]);

  return { advogadosMap, advogadoOptions, isLoading, error };
};
