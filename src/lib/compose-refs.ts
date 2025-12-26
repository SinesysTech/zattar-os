/**
 * Utility for composing multiple refs into a single ref callback
 * Useful when you need to forward a ref and also use it internally
 */

import { useCallback, type Ref, type RefCallback } from 'react';

/**
 * Composes multiple refs (callback refs or ref objects) into a single ref callback.
 * This is useful when you need to forward a ref and also use it internally.
 */
export function useComposedRefs<T>(...refs: Array<Ref<T> | undefined>): RefCallback<T> {
  return useCallback(
    (node: T) => {
      for (const ref of refs) {
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref != null) {
          (ref as React.MutableRefObject<T | null>).current = node;
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    refs
  );
}

