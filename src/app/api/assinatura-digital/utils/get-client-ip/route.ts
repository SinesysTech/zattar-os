import { NextRequest, NextResponse } from 'next/server';
import { getClientIp } from '@/lib/utils/get-client-ip';

export async function GET(request: NextRequest) {
  let ip = getClientIp(request);
  let source = 'headers';

  // Fallback: request.ip (disponível em plataformas como Vercel)
  if (ip === 'unknown' && 'ip' in request && typeof (request as Record<string, unknown>).ip === 'string') {
    ip = (request as Record<string, unknown>).ip as string;
    source = 'request.ip';
  }

  // Fallback: host header para ambiente de desenvolvimento local
  if (ip === 'unknown') {
    const host = request.headers.get('host') || '';
    if (host.startsWith('localhost') || host.startsWith('127.0.0.1') || host.startsWith('[::1]')) {
      ip = '127.0.0.1';
      source = 'localhost-fallback';
    }
  }

  const warning = ip === 'unknown' ? 'IP não capturado. Verifique configuração de proxy/headers.' : undefined;

  return NextResponse.json({ ip, source, warning });
}