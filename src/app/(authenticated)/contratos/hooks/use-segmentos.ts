'use client';

/**
 * CONTRATOS FEATURE - useSegmentos Hook
 *
 * Busca a lista de segmentos ativos via Server Action.
 */

import { useState, useEffect } from 'react';
import { actionListarSegmentos } from '../actions/segmentos-actions';

export interface SegmentoOption {
  id: number;
  nome: string;
  slug: string;
}

interface UseSegmentosResult {
  segmentos: SegmentoOption[];
  isLoading: boolean;
  error: string | null;
}

export function useSegmentos(): UseSegmentosResult {
  const [segmentos, setSegmentos] = useState<SegmentoOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetch = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await actionListarSegmentos();

        if (cancelled) return;

        if (!result.success) {
          setError(result.error);
          setSegmentos([]);
          return;
        }

        setSegmentos(
          result.data.map((s) => ({
            id: s.id,
            nome: s.nome,
            slug: s.slug,
          }))
        );
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Erro ao carregar segmentos');
        setSegmentos([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void fetch();

    return () => {
      cancelled = true;
    };
  }, []);

  return { segmentos, isLoading, error };
}
