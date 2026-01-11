import { isEncrypted, parseEncryptedTimestamp, TTL_MS } from '@/lib/utils/secure-storage';

export function clearAllSecureStorage(): void {
  if (typeof window === 'undefined') return;

  const keysToRemove = ['chat-notifications', 'chat-unread-counts', 'call-layout'];

  keysToRemove.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Erro ao remover ${key}:`, error);
    }
  });
}

export function clearExpiredSecureStorage(): void {
  if (typeof window === 'undefined') return;

  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    try {
      const value = localStorage.getItem(key);
      if (!value) return;

      if (isEncrypted(value)) {
        const timestamp = parseEncryptedTimestamp(value);
        const now = Date.now();
        const ttl = TTL_MS; // 7 dias

        if (timestamp !== null && now - timestamp > ttl) {
          localStorage.removeItem(key);
        }
      }
    } catch {
      // Ignorar erros de parsing
    }
  });
}
