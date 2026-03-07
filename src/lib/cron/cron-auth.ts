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

export function getExpectedCronSecrets(): string[] {
  const secrets = [process.env.CRON_SECRET, process.env.VERCEL_CRON_SECRET]
    .filter((secret): secret is string => typeof secret === 'string' && secret.trim().length > 0)
    .map((secret) => secret.trim());

  return [...new Set(secrets)];
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

  const expectedTokens = getExpectedCronSecrets();
  if (expectedTokens.length === 0) {
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
    expectedTokens.some((expectedToken) => safeEqual(authHeader.trim(), expectedToken))
  ) {
    providedToken = authHeader.trim();
  }

  const matchedExpectedToken = providedToken
    ? expectedTokens.find((expectedToken) => safeEqual(providedToken, expectedToken)) || null
    : null;

  if (!providedToken || !matchedExpectedToken) {
    const firstExpectedToken = expectedTokens[0];
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
      expectedTokenLength: firstExpectedToken?.length,
      expectedTokenEqualsProvided: !!matchedExpectedToken,
      expectedTokenCandidates: expectedTokens.length,
      // Loging first few chars to check for obvious mismatches (safe to remove later)
      providedTokenPrefix: providedToken
        ? providedToken.substring(0, 5) + "..."
        : "null",
      expectedTokenPrefix: firstExpectedToken
        ? firstExpectedToken.substring(0, 5) + "..."
        : "null",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
