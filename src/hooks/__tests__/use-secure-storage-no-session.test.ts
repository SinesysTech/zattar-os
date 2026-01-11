import { webcrypto } from 'crypto';
import { renderHook, waitFor, act } from '@testing-library/react';

// Mock useAuth to return null sessionToken BEFORE importing useSecureStorage
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: null,
    sessionToken: null,
    isLoading: false,
    isAuthenticated: false,
  }),
}));

import { useSecureStorage } from '@/hooks/use-secure-storage';

function createLocalStorageMock(initial?: Record<string, string>) {
  const store = new Map<string, string>(Object.entries(initial ?? {}));

  return {
    getItem: jest.fn((k: string) => (store.has(k) ? store.get(k)! : null)),
    setItem: jest.fn((k: string, v: string) => {
      store.set(k, v);
    }),
    removeItem: jest.fn((k: string) => {
      store.delete(k);
    }),
    clear: jest.fn(() => store.clear()),
    key: jest.fn((i: number) => Array.from(store.keys())[i] ?? null),
    get length() {
      return store.size;
    },
  };
}

describe('useSecureStorage without session', () => {
  beforeAll(() => {
    const real = webcrypto as unknown as Crypto;
    const mockCrypto = {
      subtle: {
        importKey: jest.fn(real.subtle.importKey.bind(real.subtle)),
        deriveKey: jest.fn(real.subtle.deriveKey.bind(real.subtle)),
        encrypt: jest.fn(real.subtle.encrypt.bind(real.subtle)),
        decrypt: jest.fn(real.subtle.decrypt.bind(real.subtle)),
      },
      getRandomValues: jest.fn(real.getRandomValues.bind(real)),
    } as unknown as Crypto;

    Object.defineProperty(globalThis, 'crypto', {
      value: mockCrypto,
      configurable: true,
      writable: true,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'localStorage', {
      value: createLocalStorageMock(),
      writable: true,
      configurable: true,
    });
  });

  it('removes plaintext from localStorage when migrateFromPlaintext=true and no session', async () => {
    Object.defineProperty(window, 'localStorage', {
      value: createLocalStorageMock({ k: JSON.stringify({ a: 1 }) }),
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() =>
      useSecureStorage('k', { a: 0 }, { migrateFromPlaintext: true })
    );

    await waitFor(() => {
      expect(result.current[2].isLoading).toBe(false);
    });

    // Plaintext value should be loaded into memory
    expect(result.current[0]).toEqual({ a: 1 });

    // But the plaintext should be removed from localStorage (Comment 4 fix)
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('k');
  });

  it('does not persist value when setting with no session', async () => {
    const { result } = renderHook(() => useSecureStorage('k', 'default'));

    await waitFor(() => {
      expect(result.current[2].isLoading).toBe(false);
    });

    // Try to set a new value - wrap in act since it causes state updates
    await act(async () => {
      result.current[1]('new-value');
      // Wait a bit for async operations
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    // Value should be updated in memory
    expect(result.current[0]).toBe('new-value');

    // But localStorage.setItem should NOT be called (no encryption without session)
    expect(window.localStorage.setItem).not.toHaveBeenCalled();
  });
});
