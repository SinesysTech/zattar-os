/**
 * Tests for IP blocking module
 */

// Mock Redis before importing the module
jest.mock('@/lib/redis/client', () => ({
  getRedisClient: jest.fn(() => null),
}));

jest.mock('@/lib/redis/utils', () => ({
  isRedisAvailable: jest.fn(() => Promise.resolve(false)),
}));

import {
  isIpBlocked,
  blockIp,
  unblockIp,
  isIpWhitelisted,
  addToWhitelist,
  removeFromWhitelist,
  recordSuspiciousActivity,
  getBlockedIps,
  getBlockInfo,
  clearSuspiciousActivity,
  IP_BLOCKING_ENABLED,
  BLOCK_THRESHOLDS,
} from '../ip-blocking';

describe('IP Blocking Module', () => {
  beforeEach(() => {
    // Reset any state between tests
    jest.clearAllMocks();
  });

  describe('isIpBlocked', () => {
    it('should return false for non-blocked IP', async () => {
      const result = await isIpBlocked('192.168.1.100');
      expect(result).toBe(false);
    });

    it('should return true for blocked IP', async () => {
      await blockIp('192.168.1.200', {
        type: 'manual',
        count: 1,
        timestamp: Date.now(),
        details: 'Test block',
      });

      const result = await isIpBlocked('192.168.1.200');
      expect(result).toBe(true);

      // Cleanup
      await unblockIp('192.168.1.200');
    });

    it('should return false for whitelisted IP even if blocked', async () => {
      await addToWhitelist('192.168.1.201');

      // Attempt to block (should be prevented)
      await blockIp('192.168.1.201', {
        type: 'manual',
        count: 1,
        timestamp: Date.now(),
      });

      const blocked = await isIpBlocked('192.168.1.201');
      expect(blocked).toBe(false);

      // Cleanup
      await removeFromWhitelist('192.168.1.201');
    });
  });

  describe('blockIp / unblockIp', () => {
    it('should block and unblock IP', async () => {
      const testIp = '10.0.0.50';

      await blockIp(testIp, {
        type: 'auth_failures',
        count: 5,
        timestamp: Date.now(),
        details: 'Test',
      });

      expect(await isIpBlocked(testIp)).toBe(true);

      await unblockIp(testIp);

      expect(await isIpBlocked(testIp)).toBe(false);
    });

    it('should not block whitelisted IP', async () => {
      const testIp = '10.0.0.51';

      await addToWhitelist(testIp);

      await blockIp(testIp, {
        type: 'manual',
        count: 1,
        timestamp: Date.now(),
      });

      expect(await isIpBlocked(testIp)).toBe(false);

      // Cleanup
      await removeFromWhitelist(testIp);
    });
  });

  describe('Whitelist', () => {
    it('should add IP to whitelist', async () => {
      const testIp = '10.0.0.60';

      expect(await isIpWhitelisted(testIp)).toBe(false);

      await addToWhitelist(testIp);

      expect(await isIpWhitelisted(testIp)).toBe(true);

      // Cleanup
      await removeFromWhitelist(testIp);
    });

    it('should remove IP from whitelist', async () => {
      const testIp = '10.0.0.61';

      await addToWhitelist(testIp);
      expect(await isIpWhitelisted(testIp)).toBe(true);

      await removeFromWhitelist(testIp);
      expect(await isIpWhitelisted(testIp)).toBe(false);
    });

    it('should include env whitelist IPs', async () => {
      // These should be in the default ENV_WHITELIST
      expect(await isIpWhitelisted('127.0.0.1')).toBe(true);
      expect(await isIpWhitelisted('::1')).toBe(true);
    });

    it('should not remove env whitelist IPs', async () => {
      await removeFromWhitelist('127.0.0.1');
      // Should still be whitelisted from env
      expect(await isIpWhitelisted('127.0.0.1')).toBe(true);
    });

    it('should unblock IP when added to whitelist', async () => {
      const testIp = '10.0.0.62';

      // First block the IP
      await blockIp(testIp, {
        type: 'manual',
        count: 1,
        timestamp: Date.now(),
      });
      expect(await isIpBlocked(testIp)).toBe(true);

      // Add to whitelist should also unblock
      await addToWhitelist(testIp);
      expect(await isIpBlocked(testIp)).toBe(false);
      expect(await isIpWhitelisted(testIp)).toBe(true);

      // Cleanup
      await removeFromWhitelist(testIp);
    });
  });

  describe('recordSuspiciousActivity', () => {
    it('should record activity without blocking below threshold', async () => {
      const testIp = '10.0.0.70';
      const threshold = BLOCK_THRESHOLDS.auth_failures.count;

      // Record one less than threshold
      for (let i = 0; i < threshold - 1; i++) {
        const result = await recordSuspiciousActivity(testIp, 'auth_failures');
        expect(result.blocked).toBe(false);
        expect(result.count).toBe(i + 1);
      }

      expect(await isIpBlocked(testIp)).toBe(false);
    });

    it('should auto-block when threshold exceeded', async () => {
      const testIp = '10.0.0.71';
      const threshold = BLOCK_THRESHOLDS.auth_failures.count;

      // Record exactly threshold times
      for (let i = 0; i < threshold; i++) {
        await recordSuspiciousActivity(testIp, 'auth_failures');
      }

      expect(await isIpBlocked(testIp)).toBe(true);

      // Cleanup
      await unblockIp(testIp);
    });

    it('should not record activity for whitelisted IPs', async () => {
      const testIp = '10.0.0.72';

      await addToWhitelist(testIp);

      const threshold = BLOCK_THRESHOLDS.auth_failures.count;

      // Record many times - should not block
      for (let i = 0; i < threshold * 2; i++) {
        const result = await recordSuspiciousActivity(testIp, 'auth_failures');
        expect(result.blocked).toBe(false);
        expect(result.count).toBe(0);
      }

      expect(await isIpBlocked(testIp)).toBe(false);

      // Cleanup
      await removeFromWhitelist(testIp);
    });
  });

  describe('getBlockedIps', () => {
    it('should return list of blocked IPs', async () => {
      const testIp1 = '10.0.0.80';
      const testIp2 = '10.0.0.81';

      await blockIp(testIp1, {
        type: 'manual',
        count: 1,
        timestamp: Date.now(),
      });

      await blockIp(testIp2, {
        type: 'auth_failures',
        count: 5,
        timestamp: Date.now(),
      });

      const blockedIps = await getBlockedIps();

      expect(blockedIps.length).toBeGreaterThanOrEqual(2);
      expect(blockedIps.some((b) => b.ip === testIp1)).toBe(true);
      expect(blockedIps.some((b) => b.ip === testIp2)).toBe(true);

      // Cleanup
      await unblockIp(testIp1);
      await unblockIp(testIp2);
    });
  });

  describe('getBlockInfo', () => {
    it('should return block info for blocked IP', async () => {
      const testIp = '10.0.0.90';
      const timestamp = Date.now();

      await blockIp(testIp, {
        type: 'rate_limit_abuse',
        count: 10,
        timestamp,
        details: 'Test details',
      });

      const info = await getBlockInfo(testIp);

      expect(info).not.toBeNull();
      expect(info?.ip).toBe(testIp);
      expect(info?.reason.type).toBe('rate_limit_abuse');
      expect(info?.reason.count).toBe(10);
      expect(info?.reason.details).toBe('Test details');
      expect(info?.permanent).toBe(false);

      // Cleanup
      await unblockIp(testIp);
    });

    it('should return null for non-blocked IP', async () => {
      const info = await getBlockInfo('10.0.0.91');
      expect(info).toBeNull();
    });
  });

  describe('clearSuspiciousActivity', () => {
    it('should clear suspicious activity for IP', async () => {
      const testIp = '10.0.0.100';

      // Record some activity
      await recordSuspiciousActivity(testIp, 'auth_failures');
      await recordSuspiciousActivity(testIp, 'auth_failures');

      // Clear it
      await clearSuspiciousActivity(testIp);

      // Record again - count should restart
      const result = await recordSuspiciousActivity(testIp, 'auth_failures');
      expect(result.count).toBe(1);
    });
  });

  describe('Temporary vs Permanent blocking', () => {
    it('should create temporary block with TTL', async () => {
      const testIp = '10.0.0.110';

      await blockIp(
        testIp,
        {
          type: 'manual',
          count: 1,
          timestamp: Date.now(),
        },
        60000 // 1 minute TTL
      );

      const info = await getBlockInfo(testIp);
      expect(info?.permanent).toBe(false);
      expect(info?.expiresAt).not.toBeNull();

      // Cleanup
      await unblockIp(testIp);
    });

    it('should create permanent block with TTL = 0', async () => {
      const testIp = '10.0.0.111';

      await blockIp(
        testIp,
        {
          type: 'manual',
          count: 1,
          timestamp: Date.now(),
        },
        0 // Permanent
      );

      const info = await getBlockInfo(testIp);
      expect(info?.permanent).toBe(true);
      expect(info?.expiresAt).toBeNull();

      // Cleanup
      await unblockIp(testIp);
    });
  });

  describe('Configuration', () => {
    it('should have IP_BLOCKING_ENABLED defined', () => {
      expect(typeof IP_BLOCKING_ENABLED).toBe('boolean');
    });

    it('should have BLOCK_THRESHOLDS for all activity types', () => {
      expect(BLOCK_THRESHOLDS.auth_failures).toBeDefined();
      expect(BLOCK_THRESHOLDS.rate_limit_abuse).toBeDefined();
      expect(BLOCK_THRESHOLDS.invalid_endpoints).toBeDefined();
      expect(BLOCK_THRESHOLDS.manual).toBeDefined();
    });
  });
});
