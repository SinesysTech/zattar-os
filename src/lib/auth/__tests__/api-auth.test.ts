import { authenticateRequest } from "../api-auth";
import { NextRequest } from "next/server";
import { recordSuspiciousActivity } from "@/lib/security/ip-blocking";

// Mock das dependências
jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(),
}));

jest.mock("@/lib/supabase/service-client", () => ({
  createServiceClient: jest.fn(),
}));

jest.mock("@/lib/security/ip-blocking", () => ({
  recordSuspiciousActivity: jest.fn(),
}));

jest.mock("@/lib/utils/get-client-ip", () => ({
  getClientIp: jest.fn().mockReturnValue("127.0.0.1"),
}));

describe("API Auth - authenticateRequest (Service API Key)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.SERVICE_API_KEY = "super-secret-key";
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should authenticate correctly with a valid Service API Key", async () => {
    const request = new NextRequest("https://api.test", {
      headers: {
        "x-service-api-key": "super-secret-key",
      },
    });

    const result = await authenticateRequest(request);

    expect(result.authenticated).toBe(true);
    expect(result.source).toBe("service");
    expect(result.userId).toBe("system");
  });

  it("should fail authentication with an invalid Service API Key", async () => {
    const request = new NextRequest("https://api.test", {
      headers: {
        "x-service-api-key": "wrong-key",
      },
    });

    const result = await authenticateRequest(request);

    expect(result.authenticated).toBe(false);
    expect(result.error).toContain("Service API Key inválida");
    expect(recordSuspiciousActivity).toHaveBeenCalledWith(
      "127.0.0.1",
      "auth_failures",
      "Invalid service API key"
    );
  });

  it("should fail authentication with a Service API Key of different length", async () => {
    const request = new NextRequest("https://api.test", {
      headers: {
        "x-service-api-key": "short",
      },
    });

    const result = await authenticateRequest(request);

    expect(result.authenticated).toBe(false);
    expect(result.error).toContain("Service API Key inválida");
  });

  it("should fail if x-service-api-key is provided but SERVICE_API_KEY is not configured", async () => {
    delete process.env.SERVICE_API_KEY;

    const request = new NextRequest("https://api.test", {
      headers: {
        "x-service-api-key": "some-key",
      },
    });

    const result = await authenticateRequest(request);

    expect(result.authenticated).toBe(false);
    expect(result.error).toContain("SERVICE_API_KEY não configurada");
  });
});
