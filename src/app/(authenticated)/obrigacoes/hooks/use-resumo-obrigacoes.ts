'use client';

import { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import { actionObterResumoObrigacoes } from '../actions/acordos';
import type { ResumoObrigacoesDB } from '../repository';

interface UseResumoObrigacoesOptions {
  /**
   * Resumo pré-buscado no servidor (evita flash de skeleton no primeiro render).
   * Quando fornecido, o hook pula o fetch inicial e usa este valor como estado.
   */
  initialData?: ResumoObrigacoesDB | null;
}

export function useResumoObrigacoes(options: UseResumoObrigacoesOptions = {}) {
  const { initialData } = options;

  const [data, setData] = useState<ResumoObrigacoesDB | null>(initialData ?? null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    startTransition(() => {
      setIsLoading(true);
    });

    const result = await actionObterResumoObrigacoes();

    startTransition(() => {
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
      setIsLoading(false);
    });
  }, []);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (initialData) return; // pula fetch — já temos dados do server
    }
    load();
  }, [load, initialData]);

  return { data, isLoading, error, refetch: load };
}
