import Redis from 'ioredis';

let redisClient: Redis | null = null;

const ENABLE_REDIS_CACHE = process.env.ENABLE_REDIS_CACHE === 'true';
// IMPORTANTE: Não inclua a senha na URL. Use REDIS_PASSWORD separadamente.
// O ioredis dá precedência à opção 'password' sobre senha embutida na URL.
const REDIS_URL = process.env.REDIS_URL;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _REDIS_CACHE_TTL = parseInt(process.env.REDIS_CACHE_TTL || '600', 10);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _REDIS_CACHE_MAX_MEMORY = process.env.REDIS_CACHE_MAX_MEMORY || '256mb';

export function getRedisClient(): Redis | null {
  if (!ENABLE_REDIS_CACHE) {
    return null;
  }

  if (!redisClient) {
    try {
      redisClient = new Redis(REDIS_URL!, {
        password: REDIS_PASSWORD,
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

export function isRedisAvailable(): boolean {
  const client = getRedisClient();
  return client !== null && client.status === 'ready';
}