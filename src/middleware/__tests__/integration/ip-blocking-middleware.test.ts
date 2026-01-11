/**
 * Integration tests for middleware + IP blocking
 */

import { NextRequest } from "next/server";

// Mock Supabase SSR client (middleware imports it)
jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
  })),
}));

jest.mock("@/lib/utils/get-client-ip", () => ({
  getClientIp: jest.fn(() => "203.0.113.10"),
}));

jest.mock("@/lib/security/ip-blocking", () => ({
  isIpBlocked: jest.fn(),
  isIpWhitelisted: jest.fn(),
  getBlockInfo: jest.fn(),
  recordSuspiciousActivity: jest.fn(),
}));

describe("Middleware IP blocking integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 403 for blocked IPs", async () => {
    const ipBlocking = await import("@/lib/security/ip-blocking");

    (ipBlocking.isIpWhitelisted as jest.Mock).mockResolvedValue(false);
    (ipBlocking.isIpBlocked as jest.Mock).mockResolvedValue(true);
    (ipBlocking.getBlockInfo as jest.Mock).mockResolvedValue({
      ip: "203.0.113.10",
      reason: { type: "manual", count: 1, timestamp: Date.now() },
      blockedAt: new Date(),
      expiresAt: null,
      permanent: false,
    });

    const { middleware } = await import("../../../../middleware");

    const req = new NextRequest("https://example.com/app/dashboard");
    const res = await middleware(req);

    expect(res.status).toBe(403);
    expect(res.headers.get("X-Blocked-Reason")).toBe("manual");
  });

  it("records suspicious activity for unknown /api/* endpoints", async () => {
    const ipBlocking = await import("@/lib/security/ip-blocking");

    (ipBlocking.isIpWhitelisted as jest.Mock).mockResolvedValue(false);
    (ipBlocking.isIpBlocked as jest.Mock).mockResolvedValue(false);
    (ipBlocking.recordSuspiciousActivity as jest.Mock).mockResolvedValue({ blocked: false, count: 1 });

    const { middleware } = await import("../../../../middleware");

    const req = new NextRequest("https://example.com/api/definitely-not-a-route");
    const res = await middleware(req);

    expect(res.status).toBe(200);
    expect(ipBlocking.recordSuspiciousActivity).toHaveBeenCalledWith(
      "203.0.113.10",
      "invalid_endpoints",
      "/api/definitely-not-a-route"
    );
  });

  it("does not record suspicious activity for known /api/* endpoints", async () => {
    const ipBlocking = await import("@/lib/security/ip-blocking");

    (ipBlocking.isIpWhitelisted as jest.Mock).mockResolvedValue(false);
    (ipBlocking.isIpBlocked as jest.Mock).mockResolvedValue(false);

    const { middleware } = await import("../../../../middleware");

    const req = new NextRequest("https://example.com/api/mcp");
    const res = await middleware(req);

    expect(res.status).toBe(200);
    expect(ipBlocking.recordSuspiciousActivity).not.toHaveBeenCalled();
  });
});
