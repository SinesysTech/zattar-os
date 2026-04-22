'use client';

/**
 * CONTRATOS FEATURE - useSegmentos Hook
 *
 * Busca a lista de segmentos ativos via Server Action.
 *
 * Aceita `initialData` opcional para hidratação vinda de Server Component.
 * Quando `initialData` é fornecido, o hook pula o fetch no client: isso evita
 * a classe de bug em que Server Actions chamadas em `useEffect` recebem 307
 * do proxy de auth e quebram o client RSC.
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

export function useSegmentos(initialData?: SegmentoOption[]): UseSegmentosResult {
  const hasInitialData = initialData !== undefined;
  const [segmentos, setSegmentos] = useState<SegmentoOption[]>(initialData ?? []);
  const [isLoading, setIsLoading] = useState(!hasInitialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hasInitialData) return;

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
  }, [hasInitialData]);

  return { segmentos, isLoading, error };
}
