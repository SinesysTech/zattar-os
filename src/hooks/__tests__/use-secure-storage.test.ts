import { webcrypto } from 'crypto';
import { renderHook, act, waitFor } from '@testing-library/react';

import { useSecureStorage } from '@/hooks/use-secure-storage';
import { buildEncryptedPayload, deriveKey, encryptData, generateSalt, TTL_MS } from '@/lib/utils/secure-storage';

const mockSessionToken = 'test-session-token-abc123';

jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-123' },
    sessionToken: mockSessionToken,
    isLoading: false,
    isAuthenticated: true,
  }),
}));

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

describe('useSecureStorage', () => {
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

  it('returns initialValue when key does not exist', async () => {
    const { result } = renderHook(() => useSecureStorage('k', 'default'));

    await waitFor(() => {
      expect(result.current[2].isLoading).toBe(false);
    });

    expect(result.current[0]).toBe('default');
  });

  it('loads and decrypts existing encrypted data', async () => {
    const sessionToken = mockSessionToken;
    const salt = generateSalt();
    const key = await deriveKey(sessionToken, salt);

    const original = { a: 1 };
    const encrypted = await encryptData(original, key);
    const payload = buildEncryptedPayload({ salt, ivCiphertext: encrypted });

    Object.defineProperty(window, 'localStorage', {
      value: createLocalStorageMock({ k: payload }),
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useSecureStorage('k', { a: 0 }));

    await waitFor(() => {
      expect(result.current[2].isLoading).toBe(false);
    });

    expect(result.current[0]).toEqual(original);
  });

  it('saves encrypted data to localStorage', async () => {
    const { result } = renderHook(() => useSecureStorage('k', 'default'));

    await waitFor(() => {
      expect(result.current[2].isLoading).toBe(false);
    });

    act(() => {
      result.current[1]('new-value');
    });

    await waitFor(() => {
      expect(window.localStorage.setItem).toHaveBeenCalled();
    });

    const lastCall = (window.localStorage.setItem as jest.Mock).mock.calls.at(-1);
    expect(lastCall?.[0]).toBe('k');
    expect(String(lastCall?.[1])).toMatch(/^enc:/);
  });

  it('migrates plaintext automatically when migrateFromPlaintext=true', async () => {
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

    expect(result.current[0]).toEqual({ a: 1 });

    await waitFor(() => {
      expect(window.localStorage.setItem).toHaveBeenCalled();
    });

    const lastCall = (window.localStorage.setItem as jest.Mock).mock.calls.at(-1);
    expect(String(lastCall?.[1])).toMatch(/^enc:/);
  });

  it('rejects expired encrypted data (TTL)', async () => {
    const sessionToken = mockSessionToken;
    const salt = generateSalt();
    const key = await deriveKey(sessionToken, salt);

    const encrypted = await encryptData({ a: 1 }, key);
    const payload = buildEncryptedPayload({
      salt,
      ivCiphertext: encrypted,
      timestamp: Date.now() - TTL_MS - 1000,
    });

    Object.defineProperty(window, 'localStorage', {
      value: createLocalStorageMock({ k: payload }),
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useSecureStorage('k', { a: 0 }));

    await waitFor(() => {
      expect(result.current[2].isLoading).toBe(false);
    });

    expect(window.localStorage.removeItem).toHaveBeenCalledWith('k');
    expect(result.current[0]).toEqual({ a: 0 });
  });

  it('returns initialValue during SSR', () => {
    const originalWindow = global.window;
    // @ts-expect-error - simulate SSR
    delete global.window;

    const { result } = renderHook(() => useSecureStorage('k', 'default'));

    expect(result.current[0]).toBe('default');
    expect(result.current[2].isLoading).toBe(false);

    global.window = originalWindow;
  });

  it('memoizes derived key per salt', async () => {
    const cryptoMock = globalThis.crypto as unknown as { subtle: { deriveKey: jest.Mock } };

    const sessionToken = mockSessionToken;
    const salt = generateSalt();
    const key = await deriveKey(sessionToken, salt);

    const encrypted = await encryptData({ a: 1 }, key);
    const payload = buildEncryptedPayload({ salt, ivCiphertext: encrypted });

    Object.defineProperty(window, 'localStorage', {
      value: createLocalStorageMock({ k: payload }),
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useSecureStorage('k', { a: 0 }));

    await waitFor(() => {
      expect(result.current[2].isLoading).toBe(false);
    });

    const callsAfterLoad = cryptoMock.subtle.deriveKey.mock.calls.length;

    act(() => {
      result.current[1]({ a: 2 });
      result.current[1]({ a: 3 });
    });

    await waitFor(() => {
      expect(window.localStorage.setItem).toHaveBeenCalled();
    });

    expect(cryptoMock.subtle.deriveKey.mock.calls.length).toBe(callsAfterLoad);
  });
});

