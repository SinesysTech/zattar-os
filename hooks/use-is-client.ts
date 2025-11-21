import { useEffect, useState } from 'react';

/**
 * Hook que retorna true apenas após a montagem no cliente.
 * Útil para evitar hydration mismatch em componentes com geração
 * dinâmica de IDs (como Radix UI com React 19).
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}
