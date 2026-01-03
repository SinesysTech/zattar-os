'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseAsyncState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export interface UseAsyncReturn<T, Args extends any[]> extends UseAsyncState<T> {
  execute: (...args: Args) => Promise<T>;
  reset: () => void;
  cancel: () => void;
}

/**
 * Hook para gerenciar estado de operações assíncronas
 *
 * @param asyncFunction - Função assíncrona a ser executada
 * @param immediate - Se true, executa a função imediatamente na montagem
 * @returns Estado e funções de controle da operação assíncrona
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { data, isLoading, error, execute } = useAsync(
 *     async (id: string) => {
 *       const response = await fetch(`/api/users/${id}`);
 *       return response.json();
 *     }
 *   );
 *
 *   return (
 *     <div>
 *       <button onClick={() => execute('123')}>Fetch User</button>
 *       {isLoading && <p>Loading...</p>}
 *       {error && <p>Error: {error.message}</p>}
 *       {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAsync<T, Args extends any[] = []>(
  asyncFunction: (...args: Args) => Promise<T>,
  immediate = false
): UseAsyncReturn<T, Args> {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    error: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
  });

  // Ref para controlar cancelamento
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Função para executar a operação assíncrona
  const execute = useCallback(
    async (...args: Args): Promise<T> => {
      // Cancela qualquer requisição anterior
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Cria novo AbortController para esta execução
      const currentController = new AbortController();
      abortControllerRef.current = currentController;

      setState({
        data: null,
        error: null,
        isLoading: true,
        isSuccess: false,
        isError: false,
      });

      try {
        const result = await asyncFunction(...args);

        // Só atualiza o estado se o componente ainda estiver montado E
        // se este controller ainda é o atual (não foi substituído por outro execute)
        if (
          isMountedRef.current &&
          abortControllerRef.current === currentController &&
          !currentController.signal.aborted
        ) {
          setState({
            data: result,
            error: null,
            isLoading: false,
            isSuccess: true,
            isError: false,
          });
        }

        return result;
      } catch (err) {
        // Ignora erros de abort
        if (err instanceof Error && err.name === 'AbortError') {
          throw err;
        }

        const error = err instanceof Error ? err : new Error('Unknown error');

        // Só atualiza o estado se o componente ainda estiver montado E
        // se este controller ainda é o atual
        if (
          isMountedRef.current &&
          abortControllerRef.current === currentController &&
          !currentController.signal.aborted
        ) {
          setState({
            data: null,
            error,
            isLoading: false,
            isSuccess: false,
            isError: true,
          });
        }

        throw error;
      }
    },
    [asyncFunction]
  );

  // Função para resetar o estado
  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      isLoading: false,
      isSuccess: false,
      isError: false,
    });
  }, []);

  // Função para cancelar a operação em andamento
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState((prev) => ({
      ...prev,
      isLoading: false,
    }));
  }, []);

  // Executa imediatamente se immediate=true
  useEffect(() => {
    if (immediate) {
      execute(...([] as unknown as Args));
    }
  }, [immediate, execute]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    execute,
    reset,
    cancel,
  };
}
