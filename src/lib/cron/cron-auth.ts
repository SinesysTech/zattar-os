import { timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);

  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

function parseBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) return null;

  const match = /^Bearer\s+(.+)$/i.exec(authorizationHeader.trim());
  return match?.[1]?.trim() || null;
}

export function getExpectedCronSecret(): string | null {
  return process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET || null;
}

/**
 * Validates cron authentication.
 *
 * Accepted headers:
 * - Authorization: Bearer <CRON_SECRET>
 * - X-Cron-Secret: <CRON_SECRET>
 */
export function requireCronAuth(
  request: NextRequest,
  options?: { logPrefix?: string }
): NextResponse | null {
  const logPrefix = options?.logPrefix ?? "[Cron]";

  const expectedToken = getExpectedCronSecret();
  if (!expectedToken) {
    console.warn(`${logPrefix} CRON_SECRET não configurado`);
    return NextResponse.json(
      { error: "Cron secret not configured" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");
  const tokenFromBearer = parseBearerToken(authHeader);
  const tokenFromHeader = request.headers.get("x-cron-secret")?.trim() || null;

  let providedToken = tokenFromBearer || tokenFromHeader;

  // Fallback: Check if the Authorization header contains the token directly (without Bearer prefix)
  // This handles cases where the user/tool sets the Authorization header to just the secret value.
  if (
    !providedToken &&
    authHeader &&
    expectedToken &&
    safeEqual(authHeader.trim(), expectedToken)
  ) {
    providedToken = authHeader.trim();
  }

  if (!providedToken || !safeEqual(providedToken, expectedToken)) {
    console.warn(`${logPrefix} Tentativa de acesso não autorizado`, {
      hasAuthorizationHeader: !!authHeader,
      // Debug info: (Do NOT log full secrets in production if possible, but for debugging this issue we need hints)
      authHeaderLength: authHeader?.length,
      authHeaderStartsWithBearer: authHeader
        ?.toLowerCase()
        .startsWith("bearer "),
      hasXCronSecretHeader: !!tokenFromHeader,
      tokenFromHeaderLength: tokenFromHeader?.length,
      providedTokenLength: providedToken?.length,
      expectedTokenLength: expectedToken.length,
      expectedTokenEqualsProvided: safeEqual(
        providedToken || "",
        expectedToken || ""
      ),
      // Loging first few chars to check for obvious mismatches (safe to remove later)
      providedTokenPrefix: providedToken
        ? providedToken.substring(0, 5) + "..."
        : "null",
      expectedTokenPrefix: expectedToken.substring(0, 5) + "...",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
