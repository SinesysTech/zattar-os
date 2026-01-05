'use client';

import { useEffect, useRef, useMemo } from 'react';

interface UseRenderCountOptions {
  /** Nome do componente para logging */
  componentName?: string;
  /** Threshold de renders antes de logar warning (padrão: 10) */
  threshold?: number;
  /** Se deve logar no console */
  enabled?: boolean;
  /** Callback quando threshold é excedido */
  onThresholdExceeded?: (count: number) => void;
}

/**
 * Hook para contar renders de um componente e detectar possíveis loops infinitos
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   useRenderCount({ componentName: 'MyComponent', threshold: 10 });
 *   // ...
 * }
 * ```
 */
export function useRenderCount(options: UseRenderCountOptions = {}) {
  const {
    componentName = 'Unknown Component',
    threshold = 10,
    enabled = process.env.NODE_ENV === 'development',
    onThresholdExceeded,
  } = options;

  const renderCount = useRef(0);
  const lastWarningTime = useRef(0);
  const startTime = useRef(Date.now());

  renderCount.current += 1;

  useEffect(() => {
    if (!enabled) return;

    const now = Date.now();
    const elapsed = now - startTime.current;
    const rendersPerSecond = (renderCount.current / elapsed) * 1000;

    // Logar warning se exceder threshold
    if (renderCount.current >= threshold) {
      // Evitar spam de warnings (máximo 1 por segundo)
      if (now - lastWarningTime.current > 1000) {
        console.warn(
          `[useRenderCount] ${componentName} renderizou ${renderCount.current} vezes`,
          {
            totalRenders: renderCount.current,
            elapsedSeconds: (elapsed / 1000).toFixed(2),
            rendersPerSecond: rendersPerSecond.toFixed(2),
          }
        );
        lastWarningTime.current = now;

        if (onThresholdExceeded) {
          onThresholdExceeded(renderCount.current);
        }
      }
    }

    // Log informativo a cada 5 renders (apenas em dev)
    if (renderCount.current % 5 === 0 && renderCount.current < threshold) {
      console.log(
        `[useRenderCount] ${componentName}: ${renderCount.current} renders (${rendersPerSecond.toFixed(2)}/s)`
      );
    }
  });

  return renderCount.current;
}

/**
 * Hook para logar mudanças em dependências de useEffect
 *
 * @example
 * ```tsx
 * useEffectDebug(() => {
 *   // efeito
 * }, [dep1, dep2], 'MyEffect');
 * ```
 */
export function useEffectDebug(
  effect: React.EffectCallback,
  deps: React.DependencyList,
  debugName: string = 'Effect'
) {
  const previousDeps = useRef<React.DependencyList>();
  const renderCount = useRef(0);

  renderCount.current += 1;

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      if (previousDeps.current) {
        const changedDeps = deps.reduce<Array<{ index: number; prev: unknown; current: unknown }>>(
          (acc, dep, index) => {
            if (dep !== previousDeps.current?.[index]) {
              acc.push({
                index,
                prev: previousDeps.current?.[index],
                current: dep,
              });
            }
            return acc;
          },
          []
        );

        if (changedDeps.length > 0) {
          console.log(`[useEffectDebug] ${debugName} executado (render ${renderCount.current})`, {
            changedDeps,
            allDeps: deps,
          });
        }
      } else {
        console.log(`[useEffectDebug] ${debugName} - primeira execução`);
      }

      previousDeps.current = deps;
    }

    return effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Hook para comparação profunda de valores
 * Útil para estabilizar objetos/arrays em dependências
 *
 * @note Este hook usa useMemo com serialização JSON para detectar mudanças profundas.
 * Para deps que não são serializáveis, use useMemo normal com deps extraídas.
 */
export function useDeepCompareMemo<T>(factory: () => T, deps: React.DependencyList): T {
  // Serializar deps para criar uma chave de comparação estável
   
  const depsKey = JSON.stringify(deps);

  // useMemo com a chave serializada como dependência
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => factory(), [depsKey]);
}

/**
 * Comparação profunda de valores
 * @deprecated Kept for reference, not currently used
 */
function _deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (typeof a !== typeof b) return false;

  if (typeof a !== 'object' || a === null || b === null) {
    return a === b;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);

  if (keysA.length !== keysB.length) return false;

  return keysA.every((key) =>
    deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
  );
}
