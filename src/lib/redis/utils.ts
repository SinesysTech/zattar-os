import { getRedisClient } from './client';

/**
 * Verifica se o Redis está disponível e pronto
 * Esta é uma função utilitária, não uma Server Action
 */
export async function isRedisAvailable(): Promise<boolean> {
  const client = getRedisClient();
  return client !== null && client.status === 'ready';
}

