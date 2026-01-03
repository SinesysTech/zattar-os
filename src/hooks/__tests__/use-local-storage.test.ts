import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../use-local-storage';

describe('useLocalStorage', () => {
  let localStorageMock: {
    getItem: jest.Mock;
    setItem: jest.Mock;
    clear: jest.Mock;
    removeItem: jest.Mock;
    length: number;
    key: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      clear: jest.fn(),
      removeItem: jest.fn(),
      length: 0,
      key: jest.fn(),
    };

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });

    // Clear console.warn spy
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return initial value when key does not exist', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));

    expect(result.current[0]).toBe('default');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key');
  });

  it('should return stored value when key exists', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify('stored-value'));

    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));

    expect(result.current[0]).toBe('stored-value');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key');
  });

  it('should store value in localStorage when setValue is called', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));

    act(() => {
      result.current[1]('new-value');
    });

    expect(result.current[0]).toBe('new-value');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'test-key',
      JSON.stringify('new-value')
    );
  });

  it('should handle object values with JSON serialization', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const initialObj = { name: 'John', age: 30 };
    const { result } = renderHook(() => useLocalStorage('test-key', initialObj));

    expect(result.current[0]).toEqual(initialObj);

    const newObj = { name: 'Jane', age: 25 };
    act(() => {
      result.current[1](newObj);
    });

    expect(result.current[0]).toEqual(newObj);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'test-key',
      JSON.stringify(newObj)
    );
  });

  it('should handle array values with JSON serialization', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify([1, 2, 3]));

    const { result } = renderHook(() => useLocalStorage<number[]>('test-key', []));

    expect(result.current[0]).toEqual([1, 2, 3]);

    act(() => {
      result.current[1]([4, 5, 6]);
    });

    expect(result.current[0]).toEqual([4, 5, 6]);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'test-key',
      JSON.stringify([4, 5, 6])
    );
  });

  it('should return initial value on JSON parse error', () => {
    localStorageMock.getItem.mockReturnValue('invalid-json{');
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));

    expect(result.current[0]).toBe('default');
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Error reading localStorage key "test-key":',
      expect.any(Error)
    );

    consoleWarnSpy.mockRestore();
  });

  it('should persist value across re-renders', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result, rerender } = renderHook(() => useLocalStorage('test-key', 'default'));

    act(() => {
      result.current[1]('persisted');
    });

    rerender();

    expect(result.current[0]).toBe('persisted');
  });

  it('should return initial value during SSR', () => {
    const originalWindow = global.window;
    // @ts-expect-error - Testing SSR behavior
    delete global.window;

    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));

    expect(result.current[0]).toBe('default');

    global.window = originalWindow;
  });

  it('should handle function updater', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(10));

    const { result } = renderHook(() => useLocalStorage('counter', 0));

    expect(result.current[0]).toBe(10);

    act(() => {
      result.current[1]((prev: number) => prev + 5);
    });

    expect(result.current[0]).toBe(15);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'counter',
      JSON.stringify(15)
    );
  });

  it('should handle boolean values', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(true));

    const { result } = renderHook(() => useLocalStorage('is-enabled', false));

    expect(result.current[0]).toBe(true);

    act(() => {
      result.current[1](false);
    });

    expect(result.current[0]).toBe(false);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'is-enabled',
      JSON.stringify(false)
    );
  });

  it('should handle null values', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(null));

    const { result } = renderHook(() => useLocalStorage<string | null>('test-key', 'default'));

    expect(result.current[0]).toBe(null);
  });

  it('should handle undefined as initial value', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useLocalStorage<string | undefined>('test-key', undefined));

    expect(result.current[0]).toBe(undefined);
  });
});
