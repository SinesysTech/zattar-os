"use client";

import { useState, useCallback, useTransition, useEffect, useRef } from "react";
import { Assistente, AssistentesParams } from "../domain";
import { actionListarAssistentes } from "../actions/assistentes-actions";
import { useDebounce } from "@/hooks/use-debounce";

interface UseAssistentesOptions {
  initialParams?: AssistentesParams;
  initialData?: Assistente[];
}

export function useAssistentes(options: UseAssistentesOptions = {}) {
  const { initialParams = {}, initialData } = options;

  const [assistentes, setAssistentes] = useState<Assistente[]>(
    initialData || []
  );
  const [isLoading, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [params, setParams] = useState<AssistentesParams>(initialParams);
  const debouncedBusca = useDebounce(params.busca, 500);

  // Track if we've used initial data to avoid fetching on mount
  const hasInitialData = useRef(!!initialData);
  const isFirstRender = useRef(true);

  const fetchAssistentes = useCallback(
    async (fetchParams: AssistentesParams) => {
      startTransition(async () => {
        setError(null);
        const result = await actionListarAssistentes(fetchParams);
        if (result.success && result.data) {
          setAssistentes(result.data);
        } else {
          setError(result.error || "Erro ao carregar assistentes");
        }
      });
    },
    []
  );

  // Update when params change
  useEffect(() => {
    // Skip first render if we have initial data and params match
    if (isFirstRender.current && hasInitialData.current) {
      isFirstRender.current = false;
      return;
    }

    isFirstRender.current = false;

    // Only fetch if params changed.
    // We need to handle the debounce for 'busca'.
    // If 'busca' changed in params but is not equal to debouncedBusca, waiting.
    if (params.busca !== undefined && params.busca !== debouncedBusca) {
      return;
    }

    fetchAssistentes({ ...params, busca: debouncedBusca });
  }, [params, debouncedBusca, fetchAssistentes]);

  // Exposed method to update search
  const setBusca = (busca: string) => setParams((prev) => ({ ...prev, busca }));

  return {
    assistentes,
    isLoading,
    error,
    setBusca,
    refetch: () => fetchAssistentes(params),
  };
}
