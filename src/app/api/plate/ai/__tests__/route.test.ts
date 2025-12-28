/// <reference types="jest" />

import { afterAll, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { NextRequest } from 'next/server';

import { POST } from '../route';

jest.mock('../../../../../lib/auth/api-auth', () => ({
  authenticateRequest: jest.fn(async () => ({
    authenticated: false,
    source: undefined,
    usuarioId: undefined,
  })),
}));

jest.mock('../../../../../lib/mcp/rate-limit', () => ({
  checkRateLimit: jest.fn(async () => ({
    allowed: true,
    remaining: 9,
    resetAt: new Date('2030-01-01T00:00:00.000Z'),
    limit: 10,
  })),
  getRateLimitHeaders: jest.fn(() => ({
    'X-RateLimit-Limit': '10',
    'X-RateLimit-Remaining': '9',
    'X-RateLimit-Reset': '2030-01-01T00:00:00.000Z',
  })),
}));

describe('/api/plate/ai route', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('returns 401 when AI_GATEWAY_API_KEY is missing', async () => {
    delete process.env.AI_GATEWAY_API_KEY;

    const request = new NextRequest('http://localhost/api/plate/ai', {
      method: 'POST',
      body: JSON.stringify({
        ctx: {
          children: [],
          selection: null,
          toolName: 'generate',
        },
        messages: [],
      }),
    });

    const res = await POST(request);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.code).toBe('MISSING_API_KEY');

    // Ensure rate limit headers are attached
    expect(res.headers.get('X-RateLimit-Limit')).toBe('10');
  });

  test('returns 429 when rate limited', async () => {
    const { checkRateLimit } = await import('../../../../../lib/mcp/rate-limit');
    (checkRateLimit as any).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetAt: new Date('2030-01-01T00:00:00.000Z'),
      limit: 10,
    });

    const request = new NextRequest('http://localhost/api/plate/ai', {
      method: 'POST',
      body: JSON.stringify({
        ctx: {
          children: [],
          selection: null,
          toolName: 'generate',
        },
        messages: [],
      }),
    });

    const res = await POST(request);
    expect(res.status).toBe(429);

    const json = await res.json();
    expect(json.code).toBe('RATE_LIMIT');
  });
});
