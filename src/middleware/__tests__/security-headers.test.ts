/**
 * Unit Tests for Security Headers Module
 *
 * Testes unitários para validar a correta geração de headers HTTP de segurança.
 */

import {
  buildSecurityHeaders,
  buildCSPDirectives,
  buildPermissionsPolicy,
  shouldApplySecurityHeaders,
  generateNonce,
  applySecurityHeaders,
  getCSPReportUri,
  REPORT_ONLY_MODE,
  CSP_REPORT_URI,
} from "../security-headers";

function parseCspDirectives(csp: string): Record<string, string> {
  const directives: Record<string, string> = {};

  for (const part of csp.split(";").map((p) => p.trim()).filter(Boolean)) {
    const [name, ...rest] = part.split(/\s+/);
    directives[name] = rest.join(" ");
  }

  return directives;
}

describe("Security Headers Module", () => {
  describe("buildSecurityHeaders", () => {
    it("should return all required security headers", () => {
      const headers = buildSecurityHeaders();

      // Verificar presença de headers obrigatórios
      expect(headers).toHaveProperty("X-Frame-Options");
      expect(headers).toHaveProperty("X-Content-Type-Options");
      expect(headers).toHaveProperty("Referrer-Policy");
      expect(headers).toHaveProperty("Permissions-Policy");
      expect(headers).toHaveProperty("Strict-Transport-Security");
      expect(headers).toHaveProperty("X-DNS-Prefetch-Control");
    });

    it("should include CSP header", () => {
      const headers = buildSecurityHeaders();

      // Deve ter ou CSP ou CSP-Report-Only
      const hasCSP =
        "Content-Security-Policy" in headers ||
        "Content-Security-Policy-Report-Only" in headers;
      expect(hasCSP).toBe(true);
    });

    it("should include nonce in CSP when provided", () => {
      const nonce = "test-nonce-12345";
      const headers = buildSecurityHeaders(nonce);

      const cspHeader =
        headers["Content-Security-Policy"] ||
        headers["Content-Security-Policy-Report-Only"];

      expect(cspHeader).toContain(`'nonce-${nonce}'`);
    });

    it("should use report-only mode when specified", () => {
      const headers = buildSecurityHeaders(undefined, true);

      expect(headers).toHaveProperty("Content-Security-Policy-Report-Only");
      expect(headers).not.toHaveProperty("Content-Security-Policy");
    });

    it("should use enforcement mode when report-only is false", () => {
      const headers = buildSecurityHeaders(undefined, false);

      expect(headers).toHaveProperty("Content-Security-Policy");
      expect(headers).not.toHaveProperty("Content-Security-Policy-Report-Only");
    });

    it("should set correct X-Frame-Options value", () => {
      const headers = buildSecurityHeaders();
      expect(headers["X-Frame-Options"]).toBe("DENY");
    });

    it("should set correct X-Content-Type-Options value", () => {
      const headers = buildSecurityHeaders();
      expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    });

    it("should set correct Referrer-Policy value", () => {
      const headers = buildSecurityHeaders();
      expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    });
  });

  describe("buildCSPDirectives", () => {
    it("should include default-src directive", () => {
      const csp = buildCSPDirectives();
      expect(csp).toContain("default-src 'self'");
    });

    it("should include nonce for inline scripts when provided", () => {
      const nonce = "my-test-nonce";
      const csp = buildCSPDirectives(nonce);

      expect(csp).toContain(`'nonce-${nonce}'`);
      expect(csp).toContain("script-src");
    });

    it("should use unsafe-inline for style-src-elem and style-src-attr (pragmatic for third-party widgets)", () => {
      const nonce = "my-test-nonce";
      const csp = buildCSPDirectives(nonce);

      const directives = parseCspDirectives(csp);
      const styleSrc = directives["style-src"];
      const styleSrcElem = directives["style-src-elem"];
      const styleSrcAttr = directives["style-src-attr"];

      // style-src still uses nonce (general fallback)
      expect(styleSrc).toBeTruthy();
      expect(styleSrc).toContain(`'nonce-${nonce}'`);

      // style-src-elem uses unsafe-inline (third-party widgets like Chatwoot/Dyte inject inline styles)
      expect(styleSrcElem).toBeTruthy();
      expect(styleSrcElem).toContain("'unsafe-inline'");

      expect(styleSrcAttr).toBeTruthy();
      expect(styleSrcAttr).toContain("'unsafe-inline'");
    });

    it("should use unsafe-inline fallback when no nonce provided", () => {
      const csp = buildCSPDirectives();

      const directives = parseCspDirectives(csp);
      expect(directives["style-src"]).toContain("'unsafe-inline'");
    });

    it("should allow trusted Supabase domains", () => {
      const csp = buildCSPDirectives();

      expect(csp).toContain("https://*.supabase.co");
      expect(csp).toContain("wss://*.supabase.co");
    });

    it("should allow trusted Backblaze B2 domains", () => {
      const csp = buildCSPDirectives();

      expect(csp).toContain("https://*.backblazeb2.com");
    });

    it("should allow Google Fonts domains", () => {
      const csp = buildCSPDirectives();

      expect(csp).toContain("https://fonts.googleapis.com");
      expect(csp).toContain("https://fonts.gstatic.com");
    });

    it("should allow OpenAI and Cohere API domains", () => {
      const csp = buildCSPDirectives();

      expect(csp).toContain("https://api.openai.com");
      expect(csp).toContain("https://api.cohere.ai");
    });

    it("should allow Dyte video domains", () => {
      const csp = buildCSPDirectives();

      const directives = parseCspDirectives(csp);
      const connectSrc = directives["connect-src"];

      expect(connectSrc).toBeTruthy();
      expect(connectSrc).toContain("https://api.dyte.io");
      expect(connectSrc).toContain("https://dyte.io");
      expect(connectSrc).toContain("https://*.dyte.io");
    });

    it("should prevent clickjacking with frame-ancestors none", () => {
      const csp = buildCSPDirectives();

      expect(csp).toContain("frame-ancestors 'none'");
    });

    it("should prevent object injection", () => {
      const csp = buildCSPDirectives();

      expect(csp).toContain("object-src 'none'");
    });

    it("should include report-uri directive", () => {
      const csp = buildCSPDirectives();

      expect(csp).toContain("report-uri");
      expect(csp).toContain(CSP_REPORT_URI);
    });

    it("should allow blob: for workers", () => {
      const csp = buildCSPDirectives();

      expect(csp).toContain("worker-src 'self' blob:");
    });
  });

  describe("buildPermissionsPolicy", () => {
    it("should disable geolocation", () => {
      const policy = buildPermissionsPolicy();
      expect(policy).toContain("geolocation=()");
    });

    it("should allow camera for self (required by Dyte)", () => {
      const policy = buildPermissionsPolicy();
      expect(policy).toContain("camera=(self)");
    });

    it("should allow microphone for self (required by Dyte)", () => {
      const policy = buildPermissionsPolicy();
      expect(policy).toContain("microphone=(self)");
    });

    it("should disable payment", () => {
      const policy = buildPermissionsPolicy();
      expect(policy).toContain("payment=()");
    });

    it("should disable usb", () => {
      const policy = buildPermissionsPolicy();
      expect(policy).toContain("usb=()");
    });

    it("should disable magnetometer", () => {
      const policy = buildPermissionsPolicy();
      expect(policy).toContain("magnetometer=()");
    });

    it("should disable gyroscope", () => {
      const policy = buildPermissionsPolicy();
      expect(policy).toContain("gyroscope=()");
    });

    it("should disable accelerometer", () => {
      const policy = buildPermissionsPolicy();
      expect(policy).toContain("accelerometer=()");
    });

    it("should allow fullscreen for self", () => {
      const policy = buildPermissionsPolicy();
      expect(policy).toContain("fullscreen=(self)");
    });
  });

  describe("shouldApplySecurityHeaders", () => {
    it("should return false for sw.js", () => {
      expect(shouldApplySecurityHeaders("/sw.js")).toBe(false);
    });

    it("should return false for manifest.json", () => {
      expect(shouldApplySecurityHeaders("/manifest.json")).toBe(false);
    });

    it("should return false for robots.txt", () => {
      expect(shouldApplySecurityHeaders("/robots.txt")).toBe(false);
    });

    it("should return false for favicon.ico", () => {
      expect(shouldApplySecurityHeaders("/favicon.ico")).toBe(false);
    });

    it("should return false for sitemap.xml", () => {
      expect(shouldApplySecurityHeaders("/sitemap.xml")).toBe(false);
    });

    it("should return false for _next/static assets", () => {
      expect(shouldApplySecurityHeaders("/_next/static/chunks/main.js")).toBe(false);
    });

    it("should return false for workbox assets", () => {
      expect(shouldApplySecurityHeaders("/workbox-abc123.js")).toBe(false);
    });

    it("should return true for normal routes", () => {
      expect(shouldApplySecurityHeaders("/app/processos")).toBe(true);
      expect(shouldApplySecurityHeaders("/api/mcp")).toBe(true);
      expect(shouldApplySecurityHeaders("/portal")).toBe(true);
      expect(shouldApplySecurityHeaders("/")).toBe(true);
    });
  });

  describe("generateNonce", () => {
    it("should generate a non-empty string", () => {
      const nonce = generateNonce();
      expect(nonce).toBeTruthy();
      expect(typeof nonce).toBe("string");
      expect(nonce.length).toBeGreaterThan(0);
    });

    it("should generate unique nonces on each call", () => {
      const nonce1 = generateNonce();
      const nonce2 = generateNonce();
      const nonce3 = generateNonce();

      expect(nonce1).not.toBe(nonce2);
      expect(nonce2).not.toBe(nonce3);
      expect(nonce1).not.toBe(nonce3);
    });

    it("should not contain dashes (UUID format cleaned)", () => {
      const nonce = generateNonce();
      expect(nonce).not.toContain("-");
    });
  });

  describe("applySecurityHeaders", () => {
    it("should apply all security headers to a Headers object", () => {
      const headers = new Headers();
      applySecurityHeaders(headers);

      expect(headers.get("X-Frame-Options")).toBe("DENY");
      expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
      expect(headers.get("Permissions-Policy")).toBeTruthy();
    });

    it("should add x-nonce header when nonce is provided", () => {
      const headers = new Headers();
      const nonce = "test-nonce-xyz";
      applySecurityHeaders(headers, nonce);

      expect(headers.get("x-nonce")).toBe(nonce);
    });

    it("should not add x-nonce header when nonce is not provided", () => {
      const headers = new Headers();
      applySecurityHeaders(headers);

      expect(headers.get("x-nonce")).toBeNull();
    });
  });

  describe("getCSPReportUri", () => {
    it("should return the configured report URI", () => {
      const uri = getCSPReportUri();
      expect(uri).toBe(CSP_REPORT_URI);
    });
  });

  describe("Constants", () => {
    it("should have REPORT_ONLY_MODE defined", () => {
      expect(typeof REPORT_ONLY_MODE).toBe("boolean");
    });

    it("should have CSP_REPORT_URI defined", () => {
      expect(typeof CSP_REPORT_URI).toBe("string");
      expect(CSP_REPORT_URI.length).toBeGreaterThan(0);
    });
  });
});
