import { sanitizeForLogs } from '@/lib/utils/sanitize-logs';

export const ENCRYPTION_VERSION = '1';
export const PBKDF2_ITERATIONS = 100_000;
export const SALT_LENGTH = 16;
export const IV_LENGTH = 12;
export const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

function getCrypto(): Crypto {
  const c = globalThis.crypto;
  if (!c?.subtle) {
    throw new Error('Web Crypto API indisponível');
  }
  return c;
}

function toBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }

  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function fromBase64(base64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function encodeUtf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function decodeUtf8(bytes: ArrayBuffer): string {
  return new TextDecoder().decode(bytes);
}

function toBufferSource(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  if (bytes.buffer instanceof ArrayBuffer) {
    return bytes as Uint8Array<ArrayBuffer>;
  }

  // If backed by SharedArrayBuffer (or otherwise typed as ArrayBufferLike),
  // copy into a new Uint8Array backed by a real ArrayBuffer.
  return new Uint8Array(bytes);
}

export function isEncrypted(value: string): boolean {
  return value.startsWith('enc:');
}

export function generateSalt(): Uint8Array {
  const crypto = getCrypto();
  const salt = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(salt);
  return salt;
}

export async function deriveKey(secret: string, salt: Uint8Array): Promise<CryptoKey> {
  const crypto = getCrypto();

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    toBufferSource(encodeUtf8(secret)),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: toBufferSource(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptData(data: unknown, key: CryptoKey): Promise<string> {
  const crypto = getCrypto();

  const iv = new Uint8Array(IV_LENGTH);
  crypto.getRandomValues(iv);

  const plaintext = encodeUtf8(JSON.stringify(data));

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toBufferSource(iv) },
    key,
    toBufferSource(plaintext)
  );

  return `${toBase64(iv)}:${toBase64(new Uint8Array(ciphertext))}`;
}

export async function decryptData(encryptedData: string, key: CryptoKey): Promise<unknown | null> {
  try {
    if (!isEncrypted(encryptedData)) return null;

    const parts = encryptedData.split(':');
    // enc:{version}:{salt}:{iv}:{ciphertext}:{timestamp}
    if (parts.length < 6) return null;

    const [, version, , ivB64, ciphertextB64, timestampStr] = parts;

    if (version !== ENCRYPTION_VERSION) return null;

    const timestamp = Number.parseInt(timestampStr ?? '', 10);
    if (!Number.isFinite(timestamp)) return null;

    const now = Date.now();
    if (now - timestamp > TTL_MS) return null;

    const iv = fromBase64(ivB64 ?? '');
    const ciphertext = fromBase64(ciphertextB64 ?? '');

    const plaintext = await getCrypto().subtle.decrypt(
      { name: 'AES-GCM', iv: toBufferSource(iv) },
      key,
      toBufferSource(ciphertext)
    );

    return JSON.parse(decodeUtf8(plaintext));
  } catch (error) {
    console.error('Erro ao descriptografar dados:', sanitizeForLogs(error));
    return null;
  }
}

export function buildEncryptedPayload(params: {
  version?: string;
  salt: Uint8Array;
  ivCiphertext: string; // "iv_b64:ciphertext_b64"
  timestamp?: number;
}): string {
  const { version = ENCRYPTION_VERSION, salt, ivCiphertext, timestamp = Date.now() } = params;

  const [ivB64, ciphertextB64] = ivCiphertext.split(':');

  return `enc:${version}:${toBase64(salt)}:${ivB64}:${ciphertextB64}:${timestamp}`;
}

export function parseEncryptedTimestamp(value: string): number | null {
  if (!isEncrypted(value)) return null;
  const parts = value.split(':');
  // Prefer last part (timestamp), but tolerate older parsing mistakes.
  const candidate = parts.at(-1) ?? parts[4];
  const timestamp = Number.parseInt(candidate ?? '', 10);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function parseEncryptedSalt(value: string): Uint8Array | null {
  if (!isEncrypted(value)) return null;
  const parts = value.split(':');
  if (parts.length < 4) return null;
  const saltB64 = parts[2];
  if (!saltB64) return null;
  try {
    return fromBase64(saltB64);
  } catch {
    return null;
  }
}

export interface SecureStorageOptions {
  ttl?: number;
}

/**
 * Encrypts and stores a value in localStorage using AES-GCM/PBKDF2.
 * @param key - The localStorage key
 * @param value - The value to encrypt and store
 * @param sessionToken - The session token used to derive the encryption key
 * @param options - Optional settings (e.g., custom TTL)
 */
export async function secureSetItem<T>(
  key: string,
  value: T,
  sessionToken: string,
  options?: SecureStorageOptions
): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('secureSetItem só pode ser usado no navegador');
  }

  if (!sessionToken) {
    throw new Error('Session token é necessário para criptografar dados');
  }

  const salt = generateSalt();
  const cryptoKey = await deriveKey(sessionToken, salt);
  const ivCiphertext = await encryptData(value, cryptoKey);
  const encrypted = buildEncryptedPayload({
    salt,
    ivCiphertext,
    timestamp: Date.now(),
  });

  window.localStorage.setItem(key, encrypted);
}

/**
 * Retrieves and decrypts a value from localStorage using AES-GCM/PBKDF2.
 * Returns null if the item doesn't exist, is expired, or decryption fails.
 * @param key - The localStorage key
 * @param sessionToken - The session token used to derive the decryption key
 * @param options - Optional settings (e.g., custom TTL)
 */
export async function secureGetItem<T>(
  key: string,
  sessionToken: string,
  options?: SecureStorageOptions
): Promise<T | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!sessionToken) {
    return null;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return null;
  }

  // Check TTL before decryption
  const ttl = options?.ttl ?? TTL_MS;
  const timestamp = parseEncryptedTimestamp(raw);
  if (timestamp !== null && Date.now() - timestamp > ttl) {
    window.localStorage.removeItem(key);
    return null;
  }

  if (!isEncrypted(raw)) {
    // Return null for plaintext data; caller should handle migration separately
    return null;
  }

  const salt = parseEncryptedSalt(raw);
  if (!salt) {
    window.localStorage.removeItem(key);
    return null;
  }

  try {
    const cryptoKey = await deriveKey(sessionToken, salt);
    const decrypted = await decryptData(raw, cryptoKey);

    if (decrypted === null) {
      window.localStorage.removeItem(key);
      return null;
    }

    return decrypted as T;
  } catch (error) {
    console.error('Erro ao recuperar secure storage:', sanitizeForLogs(error));
    return null;
  }
}

/**
 * Removes a secure storage item from localStorage.
 * @param key - The localStorage key to remove
 */
export function secureRemoveItem(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(key);
}
