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
    return NextResponse.json({ error: "Cron secret not configured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  const tokenFromBearer = parseBearerToken(authHeader);
  const tokenFromHeader = request.headers.get("x-cron-secret")?.trim() || null;

  const providedToken = tokenFromBearer || tokenFromHeader;

  if (!providedToken || !safeEqual(providedToken, expectedToken)) {
    console.warn(`${logPrefix} Tentativa de acesso não autorizado`, {
      hasAuthorizationHeader: !!authHeader,
      hasXCronSecretHeader: !!tokenFromHeader,
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
