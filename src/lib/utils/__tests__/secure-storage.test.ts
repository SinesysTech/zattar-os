import { webcrypto } from 'crypto';

import {
  TTL_MS,
  buildEncryptedPayload,
  decryptData,
  deriveKey,
  encryptData,
  generateSalt,
  isEncrypted,
  secureSetItem,
  secureGetItem,
  secureRemoveItem,
} from '@/lib/utils/secure-storage';

describe('secure-storage', () => {
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

  it('deriveKey(): same input decrypts across derived keys', async () => {
    const userId = 'test-user-123';
    const salt = generateSalt();

    const keyA = await deriveKey(userId, salt);
    const keyB = await deriveKey(userId, salt);

    const data = { a: 1, b: 'x' };
    const encrypted = await encryptData(data, keyA);
    const payload = buildEncryptedPayload({ salt, ivCiphertext: encrypted });

    const decrypted = await decryptData(payload, keyB);
    expect(decrypted).toEqual(data);
  });

  it('encryptData(): returns base64 and is non-deterministic (random IV)', async () => {
    const userId = 'test-user-123';
    const salt = generateSalt();
    const key = await deriveKey(userId, salt);

    const out1 = await encryptData({ hello: 'world' }, key);
    const out2 = await encryptData({ hello: 'world' }, key);

    expect(typeof out1).toBe('string');
    expect(typeof out2).toBe('string');
    expect(out1).not.toEqual(out2);

    const decoded = Buffer.from(out1, 'base64');
    expect(decoded.length).toBeGreaterThan(12);
  });

  it('decryptData(): round-trip returns original data', async () => {
    const userId = 'test-user-123';
    const salt = generateSalt();
    const key = await deriveKey(userId, salt);

    const original = { nested: { x: 1 }, list: [1, 2, 3] };
    const encrypted = await encryptData(original, key);
    const payload = buildEncryptedPayload({ salt, ivCiphertext: encrypted });

    const decrypted = await decryptData(payload, key);
    expect(decrypted).toEqual(original);
  });

  it('isEncrypted(): detects encrypted vs plaintext', () => {
    expect(isEncrypted('enc:1:abc')).toBe(true);
    expect(isEncrypted('{"a":1}')).toBe(false);
  });

  it('decryptData(): returns null on corrupted data', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const userId = 'test-user-123';
    const salt = generateSalt();
    const key = await deriveKey(userId, salt);

    const encrypted = await encryptData({ ok: true }, key);
    const payload = buildEncryptedPayload({ salt, ivCiphertext: encrypted });

    const parts = payload.split(':');
    // ciphertext at index 4
    const ciphertext = parts[4] ?? '';
    parts[4] = ciphertext.length ? ciphertext.slice(0, -1) + (ciphertext.endsWith('A') ? 'B' : 'A') : ciphertext;

    const corrupted = parts.join(':');
    const decrypted = await decryptData(corrupted, key);
    expect(decrypted).toBeNull();

    consoleErrorSpy.mockRestore();
  });

  it('decryptData(): returns null when TTL expired', async () => {
    const userId = 'test-user-123';
    const salt = generateSalt();
    const key = await deriveKey(userId, salt);

    const encrypted = await encryptData({ ok: true }, key);
    const payload = buildEncryptedPayload({
      salt,
      ivCiphertext: encrypted,
      timestamp: Date.now() - TTL_MS - 1000,
    });

    const decrypted = await decryptData(payload, key);
    expect(decrypted).toBeNull();
  });
});

describe('secureSetItem and secureGetItem', () => {
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

  it('secureSetItem(): encrypts and stores data', async () => {
    const sessionToken = 'test-session-token';
    const data = { message: 'hello world' };

    await secureSetItem('test-key', data, sessionToken);

    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'test-key',
      expect.stringMatching(/^enc:/)
    );
  });

  it('secureSetItem(): throws when no sessionToken provided', async () => {
    await expect(secureSetItem('test-key', { a: 1 }, '')).rejects.toThrow(
      'Session token é necessário para criptografar dados'
    );
  });

  it('secureGetItem(): retrieves and decrypts data', async () => {
    const sessionToken = 'test-session-token';
    const data = { message: 'hello world' };

    await secureSetItem('test-key', data, sessionToken);
    const retrieved = await secureGetItem<typeof data>('test-key', sessionToken);

    expect(retrieved).toEqual(data);
  });

  it('secureGetItem(): returns null for non-existent key', async () => {
    const result = await secureGetItem('non-existent', 'session-token');
    expect(result).toBeNull();
  });

  it('secureGetItem(): returns null when no sessionToken provided', async () => {
    const result = await secureGetItem('test-key', '');
    expect(result).toBeNull();
  });

  it('secureGetItem(): returns null for expired data', async () => {
    const sessionToken = 'test-session-token';
    const data = { message: 'hello world' };

    // Store data
    await secureSetItem('test-key', data, sessionToken);

    // Manually create expired data
    const salt = generateSalt();
    const key = await deriveKey(sessionToken, salt);
    const encrypted = await encryptData(data, key);
    const payload = buildEncryptedPayload({
      salt,
      ivCiphertext: encrypted,
      timestamp: Date.now() - TTL_MS - 1000,
    });
    window.localStorage.setItem('expired-key', payload);

    const result = await secureGetItem('expired-key', sessionToken);
    expect(result).toBeNull();
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('expired-key');
  });

  it('secureRemoveItem(): removes item from localStorage', () => {
    window.localStorage.setItem('test-key', 'some-value');

    secureRemoveItem('test-key');

    expect(window.localStorage.removeItem).toHaveBeenCalledWith('test-key');
  });

  it('round-trip: secureSetItem and secureGetItem work together', async () => {
    const sessionToken = 'test-session-token-123';
    const complexData = {
      nested: { value: 42 },
      array: [1, 2, 3],
      string: 'test',
    };

    await secureSetItem('complex-key', complexData, sessionToken);
    const retrieved = await secureGetItem<typeof complexData>('complex-key', sessionToken);

    expect(retrieved).toEqual(complexData);
  });
});
