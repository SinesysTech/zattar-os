/**
 * Tests for get-client-ip utility
 */

import { NextRequest } from 'next/server';
import {
  getClientIp,
  getClientIpFromHeaders,
  isValidIp,
  isPrivateIp,
  anonymizeIp,
} from '../get-client-ip';

// Helper to create mock NextRequest
function createMockRequest(headers: Record<string, string>): NextRequest {
  const url = 'http://localhost:3000/api/test';
  const headersObj = new Headers(headers);
  return new NextRequest(url, { headers: headersObj });
}

describe('isValidIp', () => {
  describe('IPv4 validation', () => {
    it('should accept valid IPv4 addresses', () => {
      expect(isValidIp('192.168.1.1')).toBe(true);
      expect(isValidIp('10.0.0.1')).toBe(true);
      expect(isValidIp('172.16.0.1')).toBe(true);
      expect(isValidIp('8.8.8.8')).toBe(true);
      expect(isValidIp('255.255.255.255')).toBe(true);
      expect(isValidIp('0.0.0.0')).toBe(true);
    });

    it('should reject invalid IPv4 addresses', () => {
      expect(isValidIp('256.1.1.1')).toBe(false);
      expect(isValidIp('192.168.1')).toBe(false);
      expect(isValidIp('192.168.1.1.1')).toBe(false);
      expect(isValidIp('abc.def.ghi.jkl')).toBe(false);
      expect(isValidIp('192.168.01.1')).toBe(false); // Leading zeros
    });
  });

  describe('IPv6 validation', () => {
    it('should accept valid IPv6 addresses', () => {
      expect(isValidIp('::1')).toBe(true);
      expect(isValidIp('2001:db8::1')).toBe(true);
      expect(isValidIp('fe80::1')).toBe(true);
      expect(isValidIp('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
    });

    it('should accept IPv6 with brackets', () => {
      expect(isValidIp('[::1]')).toBe(true);
      expect(isValidIp('[2001:db8::1]')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should reject empty or null values', () => {
      expect(isValidIp('')).toBe(false);
      expect(isValidIp(null as unknown as string)).toBe(false);
      expect(isValidIp(undefined as unknown as string)).toBe(false);
    });

    it('should reject whitespace', () => {
      expect(isValidIp('   ')).toBe(false);
    });
  });
});

describe('getClientIp', () => {
  describe('x-forwarded-for header', () => {
    it('should extract first IP from x-forwarded-for', () => {
      const request = createMockRequest({
        'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178',
      });

      expect(getClientIp(request)).toBe('203.0.113.195');
    });

    it('should handle single IP in x-forwarded-for', () => {
      const request = createMockRequest({
        'x-forwarded-for': '192.168.1.1',
      });

      expect(getClientIp(request)).toBe('192.168.1.1');
    });

    it('should handle IP with port in x-forwarded-for', () => {
      const request = createMockRequest({
        'x-forwarded-for': '192.168.1.1:3000, 10.0.0.1',
      });

      expect(getClientIp(request)).toBe('192.168.1.1');
    });
  });

  describe('header priority', () => {
    it('should prioritize x-forwarded-for over other headers', () => {
      const request = createMockRequest({
        'x-forwarded-for': '1.1.1.1',
        'cf-connecting-ip': '2.2.2.2',
        'x-real-ip': '3.3.3.3',
      });

      expect(getClientIp(request)).toBe('1.1.1.1');
    });

    it('should use cf-connecting-ip when x-forwarded-for is missing', () => {
      const request = createMockRequest({
        'cf-connecting-ip': '2.2.2.2',
        'x-real-ip': '3.3.3.3',
      });

      expect(getClientIp(request)).toBe('2.2.2.2');
    });

    it('should use x-real-ip when above headers are missing', () => {
      const request = createMockRequest({
        'x-real-ip': '3.3.3.3',
        'x-client-ip': '4.4.4.4',
      });

      expect(getClientIp(request)).toBe('3.3.3.3');
    });

    it('should use x-client-ip as fallback', () => {
      const request = createMockRequest({
        'x-client-ip': '4.4.4.4',
      });

      expect(getClientIp(request)).toBe('4.4.4.4');
    });

    it('should use x-cluster-client-ip as last resort', () => {
      const request = createMockRequest({
        'x-cluster-client-ip': '5.5.5.5',
      });

      expect(getClientIp(request)).toBe('5.5.5.5');
    });
  });

  describe('fallback behavior', () => {
    it('should return "unknown" when no headers are present', () => {
      const request = createMockRequest({});
      expect(getClientIp(request)).toBe('unknown');
    });

    it('should return "unknown" when all headers have invalid IPs', () => {
      const request = createMockRequest({
        'x-forwarded-for': 'invalid',
        'cf-connecting-ip': 'also-invalid',
      });

      expect(getClientIp(request)).toBe('unknown');
    });
  });
});

describe('getClientIpFromHeaders', () => {
  it('should work with Headers object', () => {
    const headers = new Headers({
      'x-forwarded-for': '192.168.1.1',
    });

    expect(getClientIpFromHeaders(headers)).toBe('192.168.1.1');
  });

  it('should work with Map object', () => {
    const headers = new Map([['x-forwarded-for', '192.168.1.1']]);

    expect(getClientIpFromHeaders(headers)).toBe('192.168.1.1');
  });

  it('should work with plain object', () => {
    const headers = { 'x-forwarded-for': '192.168.1.1' };

    expect(getClientIpFromHeaders(headers)).toBe('192.168.1.1');
  });
});

describe('isPrivateIp', () => {
  describe('IPv4 private ranges', () => {
    it('should identify localhost', () => {
      expect(isPrivateIp('127.0.0.1')).toBe(true);
      expect(isPrivateIp('127.0.0.100')).toBe(true);
    });

    it('should identify Class A private (10.x.x.x)', () => {
      expect(isPrivateIp('10.0.0.1')).toBe(true);
      expect(isPrivateIp('10.255.255.255')).toBe(true);
    });

    it('should identify Class B private (172.16-31.x.x)', () => {
      expect(isPrivateIp('172.16.0.1')).toBe(true);
      expect(isPrivateIp('172.31.255.255')).toBe(true);
      expect(isPrivateIp('172.15.0.1')).toBe(false);
      expect(isPrivateIp('172.32.0.1')).toBe(false);
    });

    it('should identify Class C private (192.168.x.x)', () => {
      expect(isPrivateIp('192.168.0.1')).toBe(true);
      expect(isPrivateIp('192.168.255.255')).toBe(true);
    });

    it('should identify link-local (169.254.x.x)', () => {
      expect(isPrivateIp('169.254.0.1')).toBe(true);
    });
  });

  describe('IPv6 private ranges', () => {
    it('should identify IPv6 localhost', () => {
      expect(isPrivateIp('::1')).toBe(true);
    });

    it('should identify IPv6 link-local', () => {
      expect(isPrivateIp('fe80::1')).toBe(true);
    });

    it('should identify IPv6 unique local', () => {
      expect(isPrivateIp('fc00::1')).toBe(true);
      expect(isPrivateIp('fd00::1')).toBe(true);
    });
  });

  describe('public IPs', () => {
    it('should return false for public IPv4', () => {
      expect(isPrivateIp('8.8.8.8')).toBe(false);
      expect(isPrivateIp('1.1.1.1')).toBe(false);
    });

    it('should return false for public IPv6', () => {
      expect(isPrivateIp('2001:db8::1')).toBe(false);
    });
  });
});

describe('anonymizeIp', () => {
  it('should anonymize IPv4 by zeroing last octet', () => {
    expect(anonymizeIp('192.168.1.100')).toBe('192.168.1.0');
    expect(anonymizeIp('10.20.30.40')).toBe('10.20.30.0');
  });

  it('should anonymize IPv6 by keeping first 3 groups', () => {
    expect(anonymizeIp('2001:db8:85a3:0:0:8a2e:370:7334')).toBe('2001:db8:85a3::');
  });

  it('should return "unknown" for invalid IPs', () => {
    expect(anonymizeIp('invalid')).toBe('unknown');
    expect(anonymizeIp('')).toBe('unknown');
  });
});
