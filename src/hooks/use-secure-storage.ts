'use client';

import * as React from 'react';
import { useAuthSession } from '@/providers/user-provider';
import { sanitizeForLogs } from '@/lib/utils/sanitize-logs';
import {
  TTL_MS,
  buildEncryptedPayload,
  ENCRYPTION_VERSION,
  decryptData,
  deriveKey,
  encryptData,
  generateSalt,
  isEncrypted,
  parseEncryptedSalt,
  parseEncryptedTimestamp,
} from '@/lib/utils/secure-storage';

function saltToCacheKey(salt: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(salt).toString('base64');
  }

  let binary = '';
  for (let i = 0; i < salt.length; i++) {
    binary += String.fromCharCode(salt[i]!);
  }
  return btoa(binary);
}

interface UseSecureStorageOptions {
  ttl?: number;
  migrateFromPlaintext?: boolean;
}

type SetValue<T> = (value: T | ((prev: T) => T)) => void;

type UseSecureStorageState = {
  isLoading: boolean;
  error: Error | null;
};

export function useSecureStorage<T>(
  storageKey: string,
  initialValue: T,
  options?: UseSecureStorageOptions
): [T, SetValue<T>, UseSecureStorageState] {
  const { sessionToken } = useAuthSession();

  const hasWindow = typeof window !== 'undefined';
  const ttl = options?.ttl ?? TTL_MS;
  const migrateFromPlaintext = options?.migrateFromPlaintext ?? false;

  const [value, setValue] = React.useState<T>(() => initialValue);
  const [isLoading, setIsLoading] = React.useState<boolean>(hasWindow);
  const [error, setError] = React.useState<Error | null>(null);

  const saltRef = React.useRef<Uint8Array | null>(null);
  const keyCacheRef = React.useRef<Map<string, CryptoKey>>(new Map());

  const getKeyForSalt = React.useCallback(
    async (salt: Uint8Array): Promise<CryptoKey> => {
      const cacheKey = `${ENCRYPTION_VERSION}:${saltToCacheKey(salt)}`;
      const cached = keyCacheRef.current.get(cacheKey);
      if (cached) return cached;

      if (!sessionToken) {
        throw new Error('Sessão não disponível para derivar chave');
      }

      const derived = await deriveKey(sessionToken, salt);
      keyCacheRef.current.set(cacheKey, derived);
      return derived;
    },
    [sessionToken]
  );

  React.useEffect(() => {
    if (!hasWindow) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setError(null);

        const raw = window.localStorage.getItem(storageKey);
        if (!raw) {
          if (!cancelled) {
            setValue(initialValue);
            setIsLoading(false);
          }
          return;
        }

        const timestamp = parseEncryptedTimestamp(raw);
        if (timestamp !== null && Date.now() - timestamp > ttl) {
          window.localStorage.removeItem(storageKey);
          if (!cancelled) {
            setValue(initialValue);
            setIsLoading(false);
          }
          return;
        }

        if (isEncrypted(raw)) {
          const salt = parseEncryptedSalt(raw);
          if (!salt) {
            window.localStorage.removeItem(storageKey);
            if (!cancelled) {
              setValue(initialValue);
              setIsLoading(false);
            }
            return;
          }

          saltRef.current = salt;
          const key = await getKeyForSalt(salt);
          const decrypted = await decryptData(raw, key);

          if (decrypted === null) {
            window.localStorage.removeItem(storageKey);
            if (!cancelled) {
              setValue(initialValue);
              setIsLoading(false);
            }
            return;
          }

          if (!cancelled) {
            setValue(decrypted as T);
            setIsLoading(false);
          }

          return;
        }

        // Plaintext
        if (!migrateFromPlaintext) {
          try {
            const parsed = JSON.parse(raw) as T;
            if (!cancelled) {
              setValue(parsed);
              setIsLoading(false);
            }
          } catch {
            // Suporte a valores legacy em plaintext (ex: strings salvas sem JSON.stringify)
            if (typeof initialValue === 'string') {
              if (!cancelled) {
                setValue(raw as unknown as T);
                setIsLoading(false);
              }
              return;
            }

            window.localStorage.removeItem(storageKey);
            if (!cancelled) {
              setValue(initialValue);
              setIsLoading(false);
            }
          }
          return;
        }

        // migrateFromPlaintext=true
        let parsedPlain: T;
        try {
          parsedPlain = JSON.parse(raw) as T;
        } catch {
          if (typeof initialValue === 'string') {
            parsedPlain = raw as unknown as T;
          } else {
            window.localStorage.removeItem(storageKey);
            if (!cancelled) {
              setValue(initialValue);
              setIsLoading(false);
            }
            return;
          }
        }

        // We can show parsed value immediately, then encrypt+persist
        if (!cancelled) {
          setValue(parsedPlain);
        }

        if (!sessionToken) {
          // Can't encrypt without session token; remove plaintext to avoid
          // leaving sensitive data unencrypted (Comment 4 fix).
          window.localStorage.removeItem(storageKey);
          if (!cancelled) {
            setIsLoading(false);
          }
          return;
        }

        const salt = generateSalt();
        saltRef.current = salt;
        const key = await getKeyForSalt(salt);
        const ivCiphertext = await encryptData(parsedPlain, key);
        const encrypted = buildEncryptedPayload({ salt, ivCiphertext });
        window.localStorage.setItem(storageKey, encrypted);

        if (!cancelled) {
          setIsLoading(false);
        }
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Erro desconhecido');
        console.error('Erro no useSecureStorage:', sanitizeForLogs(err));
        if (!cancelled) {
          setError(err);
          setValue(initialValue);
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [getKeyForSalt, hasWindow, migrateFromPlaintext, storageKey, ttl, sessionToken, initialValue]);

  const setSecureValue = React.useCallback<SetValue<T>>(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;

        if (!hasWindow) return resolved;

        (async () => {
          try {
            setError(null);

            if (!sessionToken) {
              // No session available: keep state only.
              return;
            }

            const salt = saltRef.current ?? generateSalt();
            saltRef.current = salt;

            const key = await getKeyForSalt(salt);
            const ivCiphertext = await encryptData(resolved, key);
            const encrypted = buildEncryptedPayload({ salt, ivCiphertext });
            window.localStorage.setItem(storageKey, encrypted);
          } catch (e) {
            const err = e instanceof Error ? e : new Error('Erro desconhecido');
            console.error('Erro ao salvar secure storage:', sanitizeForLogs(err));
            setError(err);
          }
        })();

        return resolved;
      });
    },
    [getKeyForSalt, hasWindow, storageKey, sessionToken]
  );

  return [value, setSecureValue, { isLoading, error }];
}
