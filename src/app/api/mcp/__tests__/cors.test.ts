/**
 * Integration Tests for MCP API CORS Configuration
 *
 * Testes de integração para validar que os endpoints MCP aplicam
 * corretamente os headers CORS.
 */

import {
  getCorsHeaders,
  getPreflightCorsHeaders,
  isAllowedOrigin,
  ALLOWED_METHODS,
  ALLOWED_HEADERS,
  MAX_AGE,
} from "@/lib/cors/config";

describe("MCP API CORS Integration", () => {
  // Guardar env original
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.ALLOWED_ORIGINS =
      "http://localhost:3000,http://localhost:3001,https://app.example.com";
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("OPTIONS Preflight Request", () => {
    it("should return CORS headers for allowed origin", () => {
      const origin = "http://localhost:3000";
      const headers = getPreflightCorsHeaders(origin);

      expect(headers["Access-Control-Allow-Origin"]).toBe(origin);
      expect(headers["Access-Control-Allow-Methods"]).toBe(
        ALLOWED_METHODS.join(", ")
      );
      expect(headers["Access-Control-Allow-Headers"]).toBe(
        ALLOWED_HEADERS.join(", ")
      );
      expect(headers["Access-Control-Max-Age"]).toBe(MAX_AGE.toString());
      expect(headers["Vary"]).toBe("Origin");
    });

    it("should not return Access-Control-Allow-Origin for non-allowed origin", () => {
      const origin = "https://malicious.com";
      const headers = getPreflightCorsHeaders(origin);

      expect(headers["Access-Control-Allow-Origin"]).toBeUndefined();
      // Should still include basic preflight headers
      expect(headers["Access-Control-Allow-Methods"]).toBeTruthy();
      expect(headers["Access-Control-Allow-Headers"]).toBeTruthy();
      // Should include Vary: Origin for cache correctness
      expect(headers["Vary"]).toBe("Origin");
    });

    it("should handle null origin in preflight", () => {
      const headers = getPreflightCorsHeaders(null);

      expect(headers["Access-Control-Allow-Origin"]).toBeUndefined();
      expect(headers["Access-Control-Allow-Methods"]).toBeTruthy();
      expect(headers["Vary"]).toBe("Origin");
    });
  });

  describe("GET/POST Request CORS Headers", () => {
    it("should include CORS headers for allowed origin on response", () => {
      const origin = "http://localhost:3000";
      const headers = getCorsHeaders(origin);

      expect(headers["Access-Control-Allow-Origin"]).toBe(origin);
      expect(headers["Access-Control-Allow-Credentials"]).toBe("true");
      expect(headers["Vary"]).toBe("Origin");
    });

    it("should return empty headers object for non-allowed origin", () => {
      const origin = "https://attacker.com";
      const headers = getCorsHeaders(origin);

      expect(Object.keys(headers)).toHaveLength(0);
    });

    it("should return empty headers object for null origin", () => {
      const headers = getCorsHeaders(null);

      expect(Object.keys(headers)).toHaveLength(0);
    });
  });

  describe("Origin Validation", () => {
    it("should allow localhost:3000", () => {
      expect(isAllowedOrigin("http://localhost:3000")).toBe(true);
    });

    it("should allow localhost:3001", () => {
      expect(isAllowedOrigin("http://localhost:3001")).toBe(true);
    });

    it("should allow configured production domain", () => {
      expect(isAllowedOrigin("https://app.example.com")).toBe(true);
    });

    it("should reject unknown origins", () => {
      expect(isAllowedOrigin("https://unknown.com")).toBe(false);
      expect(isAllowedOrigin("http://localhost:4000")).toBe(false);
      expect(isAllowedOrigin("https://malicious-site.com")).toBe(false);
    });

    it("should reject null origin", () => {
      expect(isAllowedOrigin(null)).toBe(false);
    });

    it("should reject empty origin", () => {
      expect(isAllowedOrigin("")).toBe(false);
    });
  });

  describe("Subdomain Wildcard Support", () => {
    beforeEach(() => {
      process.env.ALLOWED_ORIGINS = "*.example.com,http://localhost:3000";
    });

    it("should allow subdomain matching wildcard", () => {
      expect(isAllowedOrigin("https://api.example.com")).toBe(true);
      expect(isAllowedOrigin("https://app.example.com")).toBe(true);
      expect(isAllowedOrigin("https://staging.example.com")).toBe(true);
    });

    it("should not allow base domain with wildcard pattern", () => {
      // *.example.com should NOT match example.com (needs a subdomain)
      expect(isAllowedOrigin("https://example.com")).toBe(false);
    });

    it("should not allow suffix attack with wildcard", () => {
      expect(isAllowedOrigin("https://example.com.attacker.com")).toBe(false);
    });
  });

  describe("MCP Endpoint Specific Headers", () => {
    it("should include x-service-api-key in allowed headers", () => {
      expect(ALLOWED_HEADERS).toContain("x-service-api-key");
    });

    it("should include Authorization in allowed headers", () => {
      expect(ALLOWED_HEADERS).toContain("Authorization");
    });

    it("should include Content-Type in allowed headers", () => {
      expect(ALLOWED_HEADERS).toContain("Content-Type");
    });

    it("should allow GET method for SSE connections", () => {
      expect(ALLOWED_METHODS).toContain("GET");
    });

    it("should allow POST method for MCP messages", () => {
      expect(ALLOWED_METHODS).toContain("POST");
    });

    it("should allow OPTIONS for preflight", () => {
      expect(ALLOWED_METHODS).toContain("OPTIONS");
    });
  });

  describe("Vary Header for Caching", () => {
    it("should include Vary: Origin for correct proxy caching", () => {
      const origin = "http://localhost:3000";
      const headers = getCorsHeaders(origin);

      expect(headers["Vary"]).toBe("Origin");
    });

    it("should include Vary in preflight response", () => {
      const origin = "http://localhost:3000";
      const headers = getPreflightCorsHeaders(origin);

      expect(headers["Vary"]).toBe("Origin");
    });
  });

  describe("Credentials Support", () => {
    it("should include Allow-Credentials for authenticated requests", () => {
      const origin = "http://localhost:3000";
      const headers = getCorsHeaders(origin);

      expect(headers["Access-Control-Allow-Credentials"]).toBe("true");
    });
  });

  describe("Security Scenarios", () => {
    it("should block CORS from file:// protocol", () => {
      expect(isAllowedOrigin("file://")).toBe(false);
    });

    it("should block CORS from data: protocol", () => {
      expect(isAllowedOrigin("data:text/html")).toBe(false);
    });

    it("should not be vulnerable to origin header injection", () => {
      // Attack: Origin header with extra content
      expect(isAllowedOrigin("http://localhost:3000\r\nX-Evil: Header")).toBe(
        false
      );
    });

    it("should require exact protocol match", () => {
      // http vs https should be different
      expect(isAllowedOrigin("https://localhost:3000")).toBe(false); // Only http allowed
      expect(isAllowedOrigin("http://app.example.com")).toBe(false); // Only https allowed
    });

    it("should require exact port match", () => {
      expect(isAllowedOrigin("http://localhost:80")).toBe(false);
      expect(isAllowedOrigin("http://localhost")).toBe(false); // Different from :3000
    });
  });
});
