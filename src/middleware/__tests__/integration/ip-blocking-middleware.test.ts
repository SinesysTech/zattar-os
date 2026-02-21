/**
 * Integration tests for middleware + IP blocking
 */

import { middleware } from "../../../../middleware";
import {
  isIpBlocked,
  isIpWhitelisted,
  getBlockInfo,
  recordSuspiciousActivity,
} from "@/lib/security/ip-blocking-edge";
import type { NextRequest } from "next/server";

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

jest.mock("@/lib/security/ip-blocking-edge", () => ({
  isIpBlocked: jest.fn(),
  isIpWhitelisted: jest.fn(),
  getBlockInfo: jest.fn(),
  recordSuspiciousActivity: jest.fn(),
}));

describe("Middleware IP blocking integration", () => {
  const makeRequest = (url: string): NextRequest => {
    const parsedUrl = new URL(url);

    return {
      headers: new Headers(),
      nextUrl: {
        pathname: parsedUrl.pathname,
      },
      cookies: {
        get: jest.fn(),
      },
    } as unknown as NextRequest;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 403 for blocked IPs", async () => {
    (isIpWhitelisted as jest.Mock).mockReturnValue(false);
    (isIpBlocked as jest.Mock).mockReturnValue(true);
    (getBlockInfo as jest.Mock).mockReturnValue({
      ip: "203.0.113.10",
      reason: { type: "manual", count: 1, timestamp: Date.now() },
      blockedAt: new Date(),
      expiresAt: null,
      permanent: false,
    });

    const req = makeRequest("https://example.com/app/dashboard");
    const res = await middleware(req);

    expect(res.status).toBe(403);
    expect(res.headers.get("X-Blocked-Reason")).toBe("manual");
  });

  it("permite /api desconhecido sem registrar atividade suspeita", async () => {
    (isIpWhitelisted as jest.Mock).mockReturnValue(false);
    (isIpBlocked as jest.Mock).mockReturnValue(false);
    (recordSuspiciousActivity as jest.Mock).mockReturnValue({ blocked: false, count: 1 });

    const req = makeRequest("https://example.com/api/definitely-not-a-route");
    const res = await middleware(req);

    expect(res.status).toBe(200);
    expect(recordSuspiciousActivity).not.toHaveBeenCalled();
  });

  it("does not record suspicious activity for known /api/* endpoints", async () => {
    (isIpWhitelisted as jest.Mock).mockReturnValue(false);
    (isIpBlocked as jest.Mock).mockReturnValue(false);

    const req = makeRequest("https://example.com/api/mcp");
    const res = await middleware(req);

    expect(res.status).toBe(200);
    expect(recordSuspiciousActivity).not.toHaveBeenCalled();
  });
});
