/**
 * Unit Tests for CORS Configuration Module
 *
 * Testes unitários para validar a correta configuração de CORS.
 */

import {
  getAllowedOrigins,
  isAllowedOrigin,
  getCorsHeaders,
  getPreflightCorsHeaders,
  getCorsConfig,
  ALLOWED_METHODS,
  ALLOWED_HEADERS,
  MAX_AGE,
} from "../config";

describe("CORS Configuration Module", () => {
  // Guardar env original
  const originalEnv = process.env;

  beforeEach(() => {
    // Resetar env antes de cada teste
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restaurar env original
    process.env = originalEnv;
  });

  describe("getAllowedOrigins", () => {
    it("should return default origins when ALLOWED_ORIGINS is not set", () => {
      delete process.env.ALLOWED_ORIGINS;

      const origins = getAllowedOrigins();

      expect(origins).toContain("http://localhost:3000");
      expect(origins).toContain("http://localhost:3001");
    });

    it("should parse ALLOWED_ORIGINS from environment variable", () => {
      process.env.ALLOWED_ORIGINS =
        "https://example.com,https://app.example.com";

      const origins = getAllowedOrigins();

      expect(origins).toContain("https://example.com");
      expect(origins).toContain("https://app.example.com");
      expect(origins).not.toContain("http://localhost:3000"); // Defaults not included when env is set
    });

    it("should filter out invalid URLs from ALLOWED_ORIGINS", () => {
      process.env.ALLOWED_ORIGINS =
        "https://valid.com,not-a-url,https://another.com";

      const origins = getAllowedOrigins();

      expect(origins).toContain("https://valid.com");
      expect(origins).toContain("https://another.com");
      expect(origins).not.toContain("not-a-url");
    });

    it("should allow wildcard patterns for subdomains", () => {
      process.env.ALLOWED_ORIGINS = "*.example.com,https://specific.com";

      const origins = getAllowedOrigins();

      expect(origins).toContain("*.example.com");
      expect(origins).toContain("https://specific.com");
    });

    it("should handle empty ALLOWED_ORIGINS gracefully", () => {
      process.env.ALLOWED_ORIGINS = "";

      const origins = getAllowedOrigins();

      // Should fall back to defaults
      expect(Array.isArray(origins)).toBe(true);
    });

    it("should include Supabase URL if available", () => {
      delete process.env.ALLOWED_ORIGINS;
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";

      const origins = getAllowedOrigins();

      expect(origins).toContain("https://test.supabase.co");
    });
  });

  describe("isAllowedOrigin", () => {
    beforeEach(() => {
      process.env.ALLOWED_ORIGINS =
        "http://localhost:3000,https://app.example.com,*.subdomain.com";
    });

    it("should return true for allowed origins", () => {
      expect(isAllowedOrigin("http://localhost:3000")).toBe(true);
      expect(isAllowedOrigin("https://app.example.com")).toBe(true);
    });

    it("should return false for non-allowed origins", () => {
      expect(isAllowedOrigin("https://malicious.com")).toBe(false);
      expect(isAllowedOrigin("http://localhost:4000")).toBe(false);
    });

    it("should return false for null origin", () => {
      expect(isAllowedOrigin(null)).toBe(false);
    });

    it("should return false for empty string origin", () => {
      expect(isAllowedOrigin("")).toBe(false);
      expect(isAllowedOrigin("   ")).toBe(false);
    });

    it("should support wildcard patterns for subdomains", () => {
      expect(isAllowedOrigin("https://api.subdomain.com")).toBe(true);
      expect(isAllowedOrigin("https://www.subdomain.com")).toBe(true);
    });

    it("should not match base domain with wildcard pattern", () => {
      // *.subdomain.com should NOT match subdomain.com (needs a subdomain)
      expect(isAllowedOrigin("https://subdomain.com")).toBe(false);
    });

    it("should not match unrelated domains with wildcard pattern", () => {
      expect(isAllowedOrigin("https://subdomain.com.malicious.com")).toBe(false);
    });
  });

  describe("getCorsHeaders", () => {
    beforeEach(() => {
      process.env.ALLOWED_ORIGINS = "http://localhost:3000,https://app.example.com";
    });

    it("should return CORS headers for allowed origin", () => {
      const headers = getCorsHeaders("http://localhost:3000");

      expect(headers["Access-Control-Allow-Origin"]).toBe("http://localhost:3000");
      expect(headers["Access-Control-Allow-Credentials"]).toBe("true");
      expect(headers["Vary"]).toBe("Origin");
    });

    it("should return empty object for non-allowed origin", () => {
      const headers = getCorsHeaders("https://malicious.com");

      expect(Object.keys(headers)).toHaveLength(0);
      expect(headers["Access-Control-Allow-Origin"]).toBeUndefined();
    });

    it("should return empty object for null origin", () => {
      const headers = getCorsHeaders(null);

      expect(Object.keys(headers)).toHaveLength(0);
    });

    it("should include Vary header for proper caching", () => {
      const headers = getCorsHeaders("http://localhost:3000");

      expect(headers["Vary"]).toBe("Origin");
    });
  });

  describe("getPreflightCorsHeaders", () => {
    beforeEach(() => {
      process.env.ALLOWED_ORIGINS = "http://localhost:3000";
    });

    it("should return full preflight headers for allowed origin", () => {
      const headers = getPreflightCorsHeaders("http://localhost:3000");

      expect(headers["Access-Control-Allow-Origin"]).toBe("http://localhost:3000");
      expect(headers["Access-Control-Allow-Methods"]).toBe(ALLOWED_METHODS.join(", "));
      expect(headers["Access-Control-Allow-Headers"]).toBe(ALLOWED_HEADERS.join(", "));
      expect(headers["Access-Control-Max-Age"]).toBe(MAX_AGE.toString());
      expect(headers["Vary"]).toBe("Origin");
    });

    it("should return headers without Allow-Origin for non-allowed origin", () => {
      const headers = getPreflightCorsHeaders("https://malicious.com");

      expect(headers["Access-Control-Allow-Origin"]).toBeUndefined();
      expect(headers["Access-Control-Allow-Methods"]).toBeTruthy();
      expect(headers["Access-Control-Allow-Headers"]).toBeTruthy();
      expect(headers["Vary"]).toBe("Origin");
    });

    it("should include allowed methods", () => {
      const headers = getPreflightCorsHeaders("http://localhost:3000");

      expect(headers["Access-Control-Allow-Methods"]).toContain("GET");
      expect(headers["Access-Control-Allow-Methods"]).toContain("POST");
      expect(headers["Access-Control-Allow-Methods"]).toContain("OPTIONS");
    });

    it("should include allowed headers", () => {
      const headers = getPreflightCorsHeaders("http://localhost:3000");

      expect(headers["Access-Control-Allow-Headers"]).toContain("Content-Type");
      expect(headers["Access-Control-Allow-Headers"]).toContain("Authorization");
    });
  });

  describe("getCorsConfig", () => {
    it("should return complete CORS configuration object", () => {
      const config = getCorsConfig();

      expect(config).toHaveProperty("allowedOrigins");
      expect(config).toHaveProperty("allowedMethods");
      expect(config).toHaveProperty("allowedHeaders");
      expect(config).toHaveProperty("maxAge");

      expect(Array.isArray(config.allowedOrigins)).toBe(true);
      expect(config.allowedMethods).toEqual(ALLOWED_METHODS);
      expect(config.allowedHeaders).toEqual(ALLOWED_HEADERS);
      expect(config.maxAge).toBe(MAX_AGE);
    });
  });

  describe("Constants", () => {
    it("should have ALLOWED_METHODS defined with correct values", () => {
      expect(ALLOWED_METHODS).toContain("GET");
      expect(ALLOWED_METHODS).toContain("POST");
      expect(ALLOWED_METHODS).toContain("OPTIONS");
    });

    it("should have ALLOWED_HEADERS defined with required values", () => {
      expect(ALLOWED_HEADERS).toContain("Content-Type");
      expect(ALLOWED_HEADERS).toContain("Authorization");
      expect(ALLOWED_HEADERS).toContain("x-service-api-key");
    });

    it("should have MAX_AGE defined as 24 hours", () => {
      expect(MAX_AGE).toBe(86400);
    });
  });

  describe("Security", () => {
    it("should not allow wildcard * as origin", () => {
      process.env.ALLOWED_ORIGINS = "*";

      const origins = getAllowedOrigins();

      // '*' alone is not a valid URL and should be filtered out
      expect(origins).not.toContain("*");
    });

    it("should prevent CORS for completely different domains", () => {
      process.env.ALLOWED_ORIGINS = "https://legitimate.com";

      expect(isAllowedOrigin("https://legitimate.com.attacker.com")).toBe(false);
      expect(isAllowedOrigin("https://attacker.com/legitimate.com")).toBe(false);
    });

    it("should require exact match for non-wildcard origins", () => {
      process.env.ALLOWED_ORIGINS = "https://app.example.com";

      expect(isAllowedOrigin("https://app.example.com")).toBe(true);
      expect(isAllowedOrigin("https://app.example.com/")).toBe(false); // With trailing slash
      expect(isAllowedOrigin("http://app.example.com")).toBe(false); // Different protocol
      expect(isAllowedOrigin("https://APP.EXAMPLE.COM")).toBe(false); // Different case
    });
  });
});
