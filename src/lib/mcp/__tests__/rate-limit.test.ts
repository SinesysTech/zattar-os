/**
 * Tests for rate limiting module
 */

// Store the original env
const originalEnv = process.env;

// Mock Redis before importing the module
jest.mock('@/lib/redis/client', () => ({
  getRedisClient: jest.fn(() => null),
}));

jest.mock('@/lib/redis/utils', () => ({
  isRedisAvailable: jest.fn(() => Promise.resolve(false)),
}));

describe('Rate Limit Module', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Fail-Closed Mode (Default)', () => {
    it('should block requests when Redis is unavailable in fail-closed mode', async () => {
      process.env.RATE_LIMIT_FAIL_MODE = 'closed';

      const { checkRateLimit } = await import('../rate-limit');

      const result = await checkRateLimit('test-user', 'authenticated');

      expect(result.allowed).toBe(false);
      expect(result.blockedReason).toBe('redis_unavailable');
    });
  });

  describe('Fail-Open Mode', () => {
    it('should allow requests when Redis is unavailable in fail-open mode', async () => {
      process.env.RATE_LIMIT_FAIL_MODE = 'open';

      jest.resetModules();
      const { checkRateLimit } = await import('../rate-limit');

      const result = await checkRateLimit('test-user', 'authenticated');

      expect(result.allowed).toBe(true);
      expect(result.blockedReason).toBeUndefined();
    });
  });

  describe('DEFAULT_LIMITS Configuration', () => {
    it('should have correct anonymous limits', async () => {
      const { DEFAULT_LIMITS } = await import('../rate-limit');

      expect(DEFAULT_LIMITS.anonymous.maxRequests).toBe(5);
      expect(DEFAULT_LIMITS.anonymous.windowMs).toBe(60000);
    });

    it('should have correct authenticated limits', async () => {
      const { DEFAULT_LIMITS } = await import('../rate-limit');

      expect(DEFAULT_LIMITS.authenticated.maxRequests).toBe(100);
      expect(DEFAULT_LIMITS.authenticated.windowMs).toBe(60000);
    });

    it('should have correct service limits', async () => {
      const { DEFAULT_LIMITS } = await import('../rate-limit');

      expect(DEFAULT_LIMITS.service.maxRequests).toBe(1000);
      expect(DEFAULT_LIMITS.service.windowMs).toBe(60000);
    });
  });

  describe('HOURLY_LIMITS Configuration', () => {
    it('should have hourly limits for anonymous tier', async () => {
      const { HOURLY_LIMITS } = await import('../rate-limit');

      expect(HOURLY_LIMITS.anonymous).toBeDefined();
      expect(HOURLY_LIMITS.anonymous?.maxRequests).toBe(100);
      expect(HOURLY_LIMITS.anonymous?.windowMs).toBe(3600000);
    });
  });

  describe('ENDPOINT_LIMITS Configuration', () => {
    it('should have endpoint-specific limits', async () => {
      const { ENDPOINT_LIMITS } = await import('../rate-limit');

      expect(ENDPOINT_LIMITS['/api/mcp']).toBeDefined();
      expect(ENDPOINT_LIMITS['/api/plate/ai']).toBeDefined();
      expect(ENDPOINT_LIMITS['/api/mcp/stream']).toBeDefined();
      expect(ENDPOINT_LIMITS['/api/auth']).toBeDefined();
    });

    it('should have more restrictive limits for critical endpoints', async () => {
      const { ENDPOINT_LIMITS, DEFAULT_LIMITS } = await import('../rate-limit');

      // /api/auth should be more restrictive than authenticated tier
      expect(ENDPOINT_LIMITS['/api/auth']?.maxRequests).toBeLessThan(
        DEFAULT_LIMITS.authenticated.maxRequests
      );
    });
  });

  describe('getRateLimitHeaders', () => {
    it('should return correct headers for allowed request', async () => {
      const { getRateLimitHeaders } = await import('../rate-limit');

      const result = {
        allowed: true,
        remaining: 95,
        resetAt: new Date('2024-01-15T10:30:00.000Z'),
        limit: 100,
      };

      const headers = getRateLimitHeaders(result);

      expect(headers['X-RateLimit-Limit']).toBe('100');
      expect(headers['X-RateLimit-Remaining']).toBe('95');
      expect(headers['X-RateLimit-Reset']).toBe('2024-01-15T10:30:00.000Z');
      expect(headers['Retry-After']).toBeUndefined();
    });

    it('should include Retry-After for blocked request', async () => {
      const { getRateLimitHeaders } = await import('../rate-limit');

      const resetAt = new Date(Date.now() + 30000); // 30 seconds from now

      const result = {
        allowed: false,
        remaining: 0,
        resetAt,
        limit: 100,
      };

      const headers = getRateLimitHeaders(result);

      expect(headers['Retry-After']).toBeDefined();
      expect(parseInt(headers['Retry-After'])).toBeGreaterThan(0);
      expect(parseInt(headers['Retry-After'])).toBeLessThanOrEqual(30);
    });
  });

  describe('RateLimitError', () => {
    it('should create error with rate limit message', async () => {
      const { RateLimitError } = await import('../rate-limit');

      const resetAt = new Date(Date.now() + 60000);
      const error = new RateLimitError(resetAt, 0, 100, 'rate_limit');

      expect(error.name).toBe('RateLimitError');
      expect(error.message).toContain('Rate limit excedido');
      expect(error.resetAt).toEqual(resetAt);
      expect(error.remaining).toBe(0);
      expect(error.limit).toBe(100);
      expect(error.reason).toBe('rate_limit');
    });

    it('should create error with redis unavailable message', async () => {
      const { RateLimitError } = await import('../rate-limit');

      const resetAt = new Date(Date.now() + 60000);
      const error = new RateLimitError(resetAt, 0, 100, 'redis_unavailable');

      expect(error.message).toContain('Serviço temporariamente indisponível');
    });
  });

  describe('checkEndpointRateLimit', () => {
    it('should combine endpoint and tier limits', async () => {
      process.env.RATE_LIMIT_FAIL_MODE = 'closed';

      const { checkEndpointRateLimit } = await import('../rate-limit');

      const result = await checkEndpointRateLimit(
        'test-user',
        '/api/plate/ai',
        'authenticated'
      );

      // In fail-closed mode with no Redis, should be blocked
      expect(result.allowed).toBe(false);
    });
  });

  describe('checkToolRateLimit', () => {
    it('should apply tool-specific limits', async () => {
      process.env.RATE_LIMIT_FAIL_MODE = 'closed';

      const { checkToolRateLimit } = await import('../rate-limit');

      const result = await checkToolRateLimit(
        'test-user',
        'busca_semantica',
        'authenticated'
      );

      // In fail-closed mode with no Redis, should be blocked
      expect(result.allowed).toBe(false);
    });
  });

  describe('resetRateLimit', () => {
    it('should not throw when Redis is unavailable', async () => {
      const { resetRateLimit } = await import('../rate-limit');

      // Should complete without throwing
      await expect(
        resetRateLimit('test-user', 'authenticated')
      ).resolves.not.toThrow();
    });
  });

  describe('getRateLimitStatus', () => {
    it('should return fail result when Redis is unavailable', async () => {
      process.env.RATE_LIMIT_FAIL_MODE = 'closed';

      const { getRateLimitStatus } = await import('../rate-limit');

      const result = await getRateLimitStatus('test-user', 'authenticated');

      expect(result.allowed).toBe(false);
    });
  });

  describe('FAIL_MODE export', () => {
    it('should export FAIL_MODE configuration', async () => {
      process.env.RATE_LIMIT_FAIL_MODE = 'closed';

      const { FAIL_MODE } = await import('../rate-limit');

      expect(['open', 'closed']).toContain(FAIL_MODE);
    });
  });
});
