import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * Hook para detectar se o componente está montado no cliente.
 * Retorna `false` durante SSR e `true` após a hidratação no cliente.
 *
 * Usa `useSyncExternalStore` para evitar problemas com o padrão
 * de chamar setState dentro de useEffect.
 */
export function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,  // getSnapshot: cliente retorna true
    () => false  // getServerSnapshot: servidor retorna false
  );
}
