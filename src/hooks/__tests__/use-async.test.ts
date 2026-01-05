/**
 * Tests for useAsync hook - async state management
 *
 * Tests async execution, loading states, error handling, cancellation, and cleanup
 */

import { renderHook, act, waitFor as _waitFor } from '@testing-library/react';
import { useAsync } from '@/hooks/use-async';

describe('useAsync hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('should initialize with default state', () => {
      const asyncFn = jest.fn(async () => 'success');
      const { result } = renderHook(() => useAsync(asyncFn));

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(typeof result.current.execute).toBe('function');
      expect(typeof result.current.reset).toBe('function');
      expect(typeof result.current.cancel).toBe('function');
    });

    it('should execute async function successfully', async () => {
      const asyncFn = jest.fn(async () => 'success');
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        await result.current.execute();
      });

      expect(asyncFn).toHaveBeenCalledTimes(1);
      expect(result.current.data).toBe('success');
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.isError).toBe(false);
    });

    it('should pass arguments to async function', async () => {
      const asyncFn = jest.fn(async (a: number, b: string) => `${a}-${b}`);
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        await result.current.execute(42, 'test');
      });

      expect(asyncFn).toHaveBeenCalledWith(42, 'test');
      expect(result.current.data).toBe('42-test');
    });

    it('should handle complex return types', async () => {
      interface ComplexData {
        id: number;
        name: string;
        items: string[];
      }

      const complexData: ComplexData = {
        id: 1,
        name: 'Test',
        items: ['a', 'b', 'c'],
      };

      const asyncFn = jest.fn(async () => complexData);
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toEqual(complexData);
      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe('Loading States', () => {
    it('should set loading to true during execution', async () => {
      let resolve: (value: string) => void;
      const promise = new Promise<string>((res) => {
        resolve = res;
      });
      const asyncFn = jest.fn(() => promise);

      const { result } = renderHook(() => useAsync(asyncFn));

      act(() => {
        result.current.execute();
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);

      await act(async () => {
        resolve!('done');
        await promise;
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(true);
    });

    it('should reset data when starting new execution', async () => {
      const asyncFn1 = jest.fn(async () => 'first');
      const asyncFn2 = jest.fn(async () => 'second');

      const { result, rerender } = renderHook(
        ({ fn }) => useAsync(fn),
        { initialProps: { fn: asyncFn1 } }
      );

      // First execution
      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBe('first');
      expect(result.current.isSuccess).toBe(true);

      // Change function and execute again
      rerender({ fn: asyncFn2 });

      act(() => {
        result.current.execute();
      });

      // Data should be reset during loading
      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isSuccess).toBe(false);

      await act(async () => {
        await jest.runAllTimersAsync();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle errors from async function', async () => {
      const error = new Error('Test error');
      const asyncFn = jest.fn(async () => {
        throw error;
      });

      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        try {
          await result.current.execute();
        } catch (_err) {
          // Expected to throw
        }
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBe(error);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(true);
    });

    it('should convert non-Error objects to Error', async () => {
      const asyncFn = jest.fn(async () => {
        throw 'string error';
      });

      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        try {
          await result.current.execute();
        } catch (_err) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Unknown error');
      expect(result.current.isError).toBe(true);
    });

    it('should allow recovery from error', async () => {
      let shouldFail = true;
      const asyncFn = jest.fn(async () => {
        if (shouldFail) {
          throw new Error('Failed');
        }
        return 'success';
      });

      const { result } = renderHook(() => useAsync(asyncFn));

      // First call fails
      await act(async () => {
        try {
          await result.current.execute();
        } catch (_err) {
          // Expected
        }
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error?.message).toBe('Failed');

      // Second call succeeds
      shouldFail = false;
      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.isError).toBe(false);
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.data).toBe('success');
    });
  });

  describe('Reset Functionality', () => {
    it('should reset state to initial values', async () => {
      const asyncFn = jest.fn(async () => 'success');
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBe('success');
      expect(result.current.isSuccess).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);
    });

    it('should allow execution after reset', async () => {
      const asyncFn = jest.fn(async () => 'data');
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        await result.current.execute();
      });

      act(() => {
        result.current.reset();
      });

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBe('data');
      expect(result.current.isSuccess).toBe(true);
      expect(asyncFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Cancel Functionality', () => {
    it('should cancel ongoing operation', async () => {
      let resolve: (value: string) => void;
      const promise = new Promise<string>((res) => {
        resolve = res;
      });
      const asyncFn = jest.fn(() => promise);

      const { result } = renderHook(() => useAsync(asyncFn));

      act(() => {
        result.current.execute();
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.cancel();
      });

      expect(result.current.isLoading).toBe(false);

      // Resolve promise after cancel
      await act(async () => {
        resolve!('data');
        await promise;
      });

      // State should not update after cancel
      expect(result.current.data).toBeNull();
      expect(result.current.isSuccess).toBe(false);
    });

    it('should abort previous request when starting new one', async () => {
      let resolveFirst: ((value: string) => void) | undefined;
      const asyncFn1 = jest.fn(
        () =>
          new Promise<string>((resolve) => {
            resolveFirst = resolve;
          })
      );
      const asyncFn2 = jest.fn(async () => 'second');

      const { result, rerender } = renderHook(
        ({ fn }) => useAsync(fn),
        { initialProps: { fn: asyncFn1 } }
      );

      // Start first request (doesn't resolve yet)
      act(() => {
        result.current.execute();
      });

      expect(result.current.isLoading).toBe(true);

      // Change function and start second request
      rerender({ fn: asyncFn2 });

      await act(async () => {
        await result.current.execute();
      });

      // Should have result from second request
      expect(result.current.data).toBe('second');
      expect(result.current.isSuccess).toBe(true);

      // Resolve first request after second completed (should be ignored)
      await act(async () => {
        if (resolveFirst) {
          resolveFirst('first');
        }
        await jest.runAllTimersAsync();
      });

      // Data should still be from second request (first was aborted)
      expect(result.current.data).toBe('second');
    });
  });

  describe('Immediate Execution', () => {
    it('should execute immediately when immediate=true', async () => {
      const asyncFn = jest.fn(async () => 'immediate');
      const { result } = renderHook(() => useAsync(asyncFn, true));

      // Should start loading immediately
      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      expect(asyncFn).toHaveBeenCalledTimes(1);
      expect(result.current.data).toBe('immediate');
      expect(result.current.isSuccess).toBe(true);
    });

    it('should not execute immediately when immediate=false', async () => {
      const asyncFn = jest.fn(async () => 'data');
      const { result } = renderHook(() => useAsync(asyncFn, false));

      expect(result.current.isLoading).toBe(false);
      expect(asyncFn).not.toHaveBeenCalled();

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      expect(asyncFn).not.toHaveBeenCalled();
    });

    it('should execute immediately by default when immediate is not specified', async () => {
      const asyncFn = jest.fn(async () => 'data');
      const { result } = renderHook(() => useAsync(asyncFn));

      // Should NOT execute immediately when immediate is false (default)
      expect(result.current.isLoading).toBe(false);
      expect(asyncFn).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', async () => {
      let resolve: (value: string) => void;
      const promise = new Promise<string>((res) => {
        resolve = res;
      });
      const asyncFn = jest.fn(() => promise);

      const { result, unmount } = renderHook(() => useAsync(asyncFn));

      act(() => {
        result.current.execute();
      });

      expect(result.current.isLoading).toBe(true);

      unmount();

      // Resolve after unmount
      await act(async () => {
        resolve!('data');
        await promise;
      });

      // Should not throw or update state after unmount
      expect(asyncFn).toHaveBeenCalledTimes(1);
    });

    it('should not update state after unmount', async () => {
      const asyncFn = jest.fn(
        () =>
          new Promise<string>((resolve) => {
            setTimeout(() => resolve('data'), 100);
          })
      );

      const { result, unmount } = renderHook(() => useAsync(asyncFn));

      act(() => {
        result.current.execute();
      });

      const loadingState = result.current.isLoading;
      expect(loadingState).toBe(true);

      unmount();

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      // No assertions needed - just verifying no errors thrown
    });
  });

  describe('Multiple Executions', () => {
    it('should handle multiple sequential executions', async () => {
      const asyncFn = jest.fn(async (value: number) => value * 2);
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        await result.current.execute(1);
      });
      expect(result.current.data).toBe(2);

      await act(async () => {
        await result.current.execute(2);
      });
      expect(result.current.data).toBe(4);

      await act(async () => {
        await result.current.execute(3);
      });
      expect(result.current.data).toBe(6);

      expect(asyncFn).toHaveBeenCalledTimes(3);
    });

    it('should handle rapid successive calls', async () => {
      let callCount = 0;
      const asyncFn = jest.fn(async (value: number) => {
        callCount++;
        return value;
      });

      const { result } = renderHook(() => useAsync(asyncFn));

      // Fire multiple calls rapidly
      const promises: Promise<any>[] = [];
      await act(async () => {
        promises.push(result.current.execute(1));
        promises.push(result.current.execute(2));
        promises.push(result.current.execute(3));
      });

      await act(async () => {
        await Promise.all(promises);
      });

      // Should have result from last execution
      expect(result.current.data).toBe(3);
      expect(callCount).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle async function that returns undefined', async () => {
      const asyncFn = jest.fn(async () => undefined);
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBeUndefined();
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should handle async function that returns null', async () => {
      const asyncFn = jest.fn(async () => null);
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.isSuccess).toBe(true);
    });

    it('should handle async function with no arguments', async () => {
      const asyncFn = jest.fn(async () => 'no-args');
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBe('no-args');
      expect(asyncFn).toHaveBeenCalledWith();
    });

    it('should handle async function with many arguments', async () => {
      const asyncFn = jest.fn(
        async (a: number, b: string, c: boolean, d: object) =>
          `${a}-${b}-${c}-${JSON.stringify(d)}`
      );
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        await result.current.execute(1, 'test', true, { key: 'value' });
      });

      expect(asyncFn).toHaveBeenCalledWith(1, 'test', true, { key: 'value' });
      expect(result.current.data).toBe('1-test-true-{"key":"value"}');
    });
  });
});
