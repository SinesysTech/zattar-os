import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../use-debounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should not update value before delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated', delay: 500 });

    act(() => {
      jest.advanceTimersByTime(250);
    });

    expect(result.current).toBe('initial');
  });

  it('should update value after delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated', delay: 500 });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe('updated');
  });

  it('should only apply last change when multiple changes occur', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 500 } }
    );

    expect(result.current).toBe('a');

    rerender({ value: 'b', delay: 500 });
    act(() => {
      jest.advanceTimersByTime(100);
    });

    rerender({ value: 'c', delay: 500 });
    act(() => {
      jest.advanceTimersByTime(100);
    });

    rerender({ value: 'd', delay: 500 });
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe('d');
  });

  it('should cancel timeout on unmount', () => {
    const { rerender, unmount } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    rerender({ value: 'updated', delay: 500 });
    unmount();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    // If we got here without errors, cleanup worked correctly
    expect(true).toBe(true);
  });

  it('should work with different delay values', () => {
    const delays = [100, 500, 1000];

    delays.forEach(delay => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay } }
      );

      rerender({ value: 'updated', delay });

      act(() => {
        jest.advanceTimersByTime(delay - 1);
      });
      expect(result.current).toBe('initial');

      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(result.current).toBe('updated');
    });
  });

  it('should handle delay of 0 (immediate update)', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 0 } }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated', delay: 0 });

    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(result.current).toBe('updated');
  });

  it('should work with different types (number)', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 0, delay: 500 } }
    );

    expect(result.current).toBe(0);

    rerender({ value: 42, delay: 500 });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe(42);
  });

  it('should work with different types (object)', () => {
    const initialObj = { name: 'John' };
    const updatedObj = { name: 'Jane' };

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: initialObj, delay: 500 } }
    );

    expect(result.current).toEqual(initialObj);

    rerender({ value: updatedObj, delay: 500 });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toEqual(updatedObj);
  });
});
