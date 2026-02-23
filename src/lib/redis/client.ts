// NOTE: This module may be imported by middleware (Edge Runtime)
// Redis operations will fail gracefully in Edge Runtime (getRedisClient returns null)

import Redis from 'ioredis';

// Next.js: Estas funções não são Server Actions
let redisClient: Redis | null = null;
let lastErrorLog = 0;
const ERROR_LOG_INTERVAL_MS = 30_000; // Log erros no máximo a cada 30s

export function getRedisClient(): Redis | null {
  const enableRedisCache = process.env.ENABLE_REDIS_CACHE === 'true';
  const redisUrl = process.env.REDIS_URL;
  const redisPassword = process.env.REDIS_PASSWORD;

  if (!enableRedisCache || !redisUrl) {
    return null;
  }

  if (!redisClient) {
    try {
      redisClient = new Redis(redisUrl, {
        password: redisPassword,
        maxRetriesPerRequest: 1,
        connectTimeout: 5000,
        commandTimeout: 3000,
        enableReadyCheck: true,
        lazyConnect: true,
        retryStrategy: (times) => {
          if (times > 5) {
            console.warn(`[Redis] Parando reconexão após ${times} tentativas. Operando sem cache.`);
            return null;
          }
          const delay = Math.min(times * 500, 5000);
          console.log(`[Redis] Reconectando em ${delay}ms (tentativa ${times})...`);
          return delay;
        },
      });

      redisClient.on('error', (err: Error) => {
        const now = Date.now();
        if (now - lastErrorLog > ERROR_LOG_INTERVAL_MS) {
          console.error('[Redis] Erro de conexão:', err.message);
          lastErrorLog = now;
        }
      });

      redisClient.on('connect', () => {
        console.log('[Redis] Conectado');
      });

      redisClient.on('ready', () => {
        console.log('[Redis] Pronto para uso');
      });

      redisClient.on('close', () => {
        console.log('[Redis] Conexão fechada');
      });

      redisClient.on('end', () => {
        console.warn('[Redis] Conexão encerrada permanentemente. Resetando client.');
        redisClient = null;
      });

      // Iniciar conexão de forma não-bloqueante
      redisClient.connect().catch((err) => {
        const now = Date.now();
        if (now - lastErrorLog > ERROR_LOG_INTERVAL_MS) {
          console.error('[Redis] Falha na conexão inicial:', err.message);
          lastErrorLog = now;
        }
      });
    } catch (error) {
      console.error('[Redis] Falha ao criar client:', error);
      redisClient = null;
    }
  }

  return redisClient;
}

export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      redisClient.disconnect();
    }
    redisClient = null;
  }
}