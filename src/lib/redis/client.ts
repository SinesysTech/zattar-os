// NOTE: This module may be imported by middleware (Edge Runtime)
// Redis operations will fail gracefully in Edge Runtime (getRedisClient returns null)

import Redis from 'ioredis';

// Next.js: Estas funções não são Server Actions
let redisClient: Redis | null = null;
const _REDIS_CACHE_TTL = parseInt(process.env.REDIS_CACHE_TTL || '600', 10);
const _REDIS_CACHE_MAX_MEMORY = process.env.REDIS_CACHE_MAX_MEMORY || '256mb';

export function getRedisClient(): Redis | null {
  const enableRedisCache = process.env.ENABLE_REDIS_CACHE === 'true';
  const redisUrl = process.env.REDIS_URL;
  const redisPassword = process.env.REDIS_PASSWORD;

  if (!enableRedisCache) {
    return null;
  }

  if (!redisClient) {
    try {
      redisClient = new Redis(redisUrl!, {
        password: redisPassword,
        maxRetriesPerRequest: 3,
        enableReadyCheck: false,
        retryStrategy: (times) => {
          if (times > 3) {
            return null; // Stop retrying after 3 attempts
          }
          return Math.min(times * 100, 2000); // Exponential backoff up to 2 seconds
        },
      });

      redisClient.on('error', (err: Error) => {
        console.error('Redis Client Error:', err);
      });

      redisClient.on('connect', () => {
        console.log('Redis Client Connected');
      });

      redisClient.on('ready', () => {
        console.log('Redis Client Ready');
      });

      redisClient.on('close', () => {
        console.log('Redis Client Connection Closed');
      });
    } catch (error) {
      console.error('Failed to create Redis client:', error);
      redisClient = null;
    }
  }

  return redisClient;
}

export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}