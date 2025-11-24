import { useEffect, useState } from 'react';

/**
 * Hook que retorna true apenas após a montagem no cliente.
 * Útil para evitar hydration mismatch em componentes com geração
 * dinâmica de IDs (como Radix UI com React 19).
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Usa queueMicrotask para evitar chamada síncrona de setState
    queueMicrotask(() => {
      setIsClient(true);
    });
  }, []);

  return isClient;
}
