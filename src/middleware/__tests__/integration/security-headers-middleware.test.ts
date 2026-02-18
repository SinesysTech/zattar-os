/**
 * Integration Tests for Security Headers Middleware
 *
 * Testes de integração para validar que o middleware aplica corretamente
 * os headers de segurança nas respostas HTTP.
 */

import {
  applySecurityHeaders,
  shouldApplySecurityHeaders,
  generateNonce,
} from "../../security-headers";

function parseCspDirectives(csp: string): Record<string, string> {
  const directives: Record<string, string> = {};

  for (const part of csp.split(";").map((p) => p.trim()).filter(Boolean)) {
    const [name, ...rest] = part.split(/\s+/);
    directives[name] = rest.join(" ");
  }

  return directives;
}

// Mock do createServerClient do Supabase
jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
  })),
}));

describe("Security Headers Middleware Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Headers Applied to Routes", () => {
    it("should apply security headers to authenticated routes", () => {
      const headers = new Headers();
      const nonce = generateNonce();

      applySecurityHeaders(headers, nonce);

      // Verificar headers de segurança
      expect(headers.get("X-Frame-Options")).toBe("DENY");
      expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
      expect(headers.get("Permissions-Policy")).toBeTruthy();

      // Verificar que CSP foi aplicado
      const csp = headers.get("Content-Security-Policy-Report-Only") ||
                  headers.get("Content-Security-Policy");
      expect(csp).toBeTruthy();

      // style-src deve ser estrito quando nonce estiver presente
      const directives = parseCspDirectives(csp || "");
      expect(directives["style-src"]).toBeTruthy();
      expect(directives["style-src"]).not.toContain("'unsafe-inline'");

      // style attributes precisam ser permitidos (muitos libs usam style="..." dinamicamente)
      expect(directives["style-src-attr"]).toBeTruthy();
      expect(directives["style-src-attr"]).toContain("'unsafe-inline'");

      // Verificar que nonce está presente
      expect(headers.get("x-nonce")).toBe(nonce);
    });

    it("should apply security headers to public routes", () => {
      const headers = new Headers();
      applySecurityHeaders(headers);

      expect(headers.get("X-Frame-Options")).toBe("DENY");
      expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    });

    it("should not require headers for public assets", () => {
      expect(shouldApplySecurityHeaders("/sw.js")).toBe(false);
      expect(shouldApplySecurityHeaders("/manifest.json")).toBe(false);
      expect(shouldApplySecurityHeaders("/favicon.ico")).toBe(false);
    });
  });

  describe("Nonce Generation", () => {
    it("should generate unique nonce for each request", () => {
      const nonces = new Set<string>();

      for (let i = 0; i < 100; i++) {
        nonces.add(generateNonce());
      }

      // Todos os nonces devem ser únicos
      expect(nonces.size).toBe(100);
    });

    it("should generate nonce of appropriate length", () => {
      const nonce = generateNonce();

      // Nonce deve ter comprimento adequado para segurança (32 chars para UUID sem hífens)
      expect(nonce.length).toBeGreaterThanOrEqual(16);
    });

    it("should include nonce in CSP header", () => {
      const headers = new Headers();
      const nonce = generateNonce();

      applySecurityHeaders(headers, nonce);

      const csp = headers.get("Content-Security-Policy-Report-Only") ||
                  headers.get("Content-Security-Policy");

      expect(csp).toContain(`'nonce-${nonce}'`);
    });
  });

  describe("CSP Allows External Resources", () => {
    it("should allow Supabase connections", () => {
      const headers = new Headers();
      applySecurityHeaders(headers);

      const csp = headers.get("Content-Security-Policy-Report-Only") ||
                  headers.get("Content-Security-Policy");

      expect(csp).toContain("https://*.supabase.co");
      expect(csp).toContain("wss://*.supabase.co");
    });

    it("should allow Google Fonts", () => {
      const headers = new Headers();
      applySecurityHeaders(headers);

      const csp = headers.get("Content-Security-Policy-Report-Only") ||
                  headers.get("Content-Security-Policy");

      expect(csp).toContain("https://fonts.googleapis.com");
      expect(csp).toContain("https://fonts.gstatic.com");
    });

    it("should allow Backblaze B2 storage", () => {
      const headers = new Headers();
      applySecurityHeaders(headers);

      const csp = headers.get("Content-Security-Policy-Report-Only") ||
                  headers.get("Content-Security-Policy");

      expect(csp).toContain("https://*.backblazeb2.com");
    });

    it("should allow AI service APIs", () => {
      const headers = new Headers();
      applySecurityHeaders(headers);

      const csp = headers.get("Content-Security-Policy-Report-Only") ||
                  headers.get("Content-Security-Policy");

      expect(csp).toContain("https://api.openai.com");
      expect(csp).toContain("https://api.cohere.ai");
    });

    it("should allow Dyte video calls", () => {
      const headers = new Headers();
      applySecurityHeaders(headers);

      const csp = headers.get("Content-Security-Policy-Report-Only") ||
                  headers.get("Content-Security-Policy");

      const directives = parseCspDirectives(csp || "");
      const connectSrc = directives["connect-src"];
      expect(connectSrc).toBeTruthy();
      expect(connectSrc).toContain("https://api.dyte.io");
      expect(connectSrc).toContain("https://dyte.io");
      expect(connectSrc).toContain("https://*.dyte.io");
    });
  });

  describe("Route-Based Header Application", () => {
    const testCases = [
      { path: "/app/processos", shouldApply: true },
      { path: "/app/dashboard", shouldApply: true },
      { path: "/portal", shouldApply: true },
      { path: "/portal/documentos", shouldApply: true },
      { path: "/api/csp-report", shouldApply: true },
      { path: "/", shouldApply: true },
      { path: "/sw.js", shouldApply: false },
      { path: "/manifest.json", shouldApply: false },
      { path: "/robots.txt", shouldApply: false },
      { path: "/favicon.ico", shouldApply: false },
      { path: "/sitemap.xml", shouldApply: false },
      { path: "/_next/static/chunks/main.js", shouldApply: false },
      { path: "/workbox-12345.js", shouldApply: false },
      { path: "/android-chrome-192x192.png", shouldApply: false },
      { path: "/apple-touch-icon.png", shouldApply: false },
    ];

    testCases.forEach(({ path, shouldApply }) => {
      it(`should ${shouldApply ? "" : "not "}apply headers to ${path}`, () => {
        expect(shouldApplySecurityHeaders(path)).toBe(shouldApply);
      });
    });
  });

  describe("Security Protections", () => {
    it("should prevent clickjacking with X-Frame-Options", () => {
      const headers = new Headers();
      applySecurityHeaders(headers);

      expect(headers.get("X-Frame-Options")).toBe("DENY");
    });

    it("should prevent MIME sniffing", () => {
      const headers = new Headers();
      applySecurityHeaders(headers);

      expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    });

    it("should control referrer information", () => {
      const headers = new Headers();
      applySecurityHeaders(headers);

      expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    });

    it("should configure browser features appropriately", () => {
      const headers = new Headers();
      applySecurityHeaders(headers);

      const policy = headers.get("Permissions-Policy");
      expect(policy).toContain("geolocation=()");
      expect(policy).toContain("camera=(self)");
      expect(policy).toContain("microphone=(self)");
      expect(policy).toContain("payment=()");
    });

    it("should prevent frame-ancestors in CSP", () => {
      const headers = new Headers();
      applySecurityHeaders(headers);

      const csp = headers.get("Content-Security-Policy-Report-Only") ||
                  headers.get("Content-Security-Policy");

      expect(csp).toContain("frame-ancestors 'none'");
    });

    it("should prevent object injection in CSP", () => {
      const headers = new Headers();
      applySecurityHeaders(headers);

      const csp = headers.get("Content-Security-Policy-Report-Only") ||
                  headers.get("Content-Security-Policy");

      expect(csp).toContain("object-src 'none'");
    });
  });
});
