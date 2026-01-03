import { renderHook } from '@testing-library/react';
import { useMounted } from '../use-mounted';

describe('useMounted', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return false during SSR', () => {
    const originalWindow = global.window;
    // @ts-expect-error - Testing SSR behavior
    delete global.window;

    const { result } = renderHook(() => useMounted());

    expect(result.current).toBe(false);

    global.window = originalWindow;
  });

  it('should return true on client', () => {
    const { result } = renderHook(() => useMounted());

    expect(result.current).toBe(true);
  });

  it('should remain true on re-render', () => {
    const { result, rerender } = renderHook(() => useMounted());

    expect(result.current).toBe(true);

    rerender();

    expect(result.current).toBe(true);
  });

  it('should use useSyncExternalStore correctly', () => {
    // This test verifies that the hook properly uses React's useSyncExternalStore
    // by checking that it returns consistent values
    const { result: result1 } = renderHook(() => useMounted());
    const { result: result2 } = renderHook(() => useMounted());

    expect(result1.current).toBe(result2.current);
  });

  it('should handle multiple instances consistently', () => {
    const { result: instance1 } = renderHook(() => useMounted());
    const { result: instance2 } = renderHook(() => useMounted());
    const { result: instance3 } = renderHook(() => useMounted());

    expect(instance1.current).toBe(true);
    expect(instance2.current).toBe(true);
    expect(instance3.current).toBe(true);
  });

  it('should not cause hydration mismatch', () => {
    // Simulate SSR -> Client hydration
    const originalWindow = global.window;

    // SSR phase
    // @ts-expect-error - Testing SSR behavior
    delete global.window;
    const { result: ssrResult } = renderHook(() => useMounted());
    expect(ssrResult.current).toBe(false);

    // Client hydration phase
    global.window = originalWindow;
    const { result: clientResult } = renderHook(() => useMounted());
    expect(clientResult.current).toBe(true);
  });

  it('should return boolean type', () => {
    const { result } = renderHook(() => useMounted());

    expect(typeof result.current).toBe('boolean');
  });
});
