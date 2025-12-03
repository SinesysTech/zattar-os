import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const headers = request.headers;
  let ip = 'unknown';
  let source = 'none';

  if (headers.get('x-forwarded-for')) {
    ip = headers.get('x-forwarded-for')!.split(',')[0].trim();
    source = 'x-forwarded-for';
  } else if (headers.get('x-real-ip')) {
    ip = headers.get('x-real-ip')!;
    source = 'x-real-ip';
  } else if (headers.get('cf-connecting-ip')) {
    ip = headers.get('cf-connecting-ip')!;
    source = 'cf-connecting-ip';
  } else if (headers.get('x-client-ip')) {
    ip = headers.get('x-client-ip')!;
    source = 'x-client-ip';
  } else if (headers.get('x-cluster-client-ip')) {
    ip = headers.get('x-cluster-client-ip')!;
    source = 'x-cluster-client-ip';
  }

  const warning = ip === 'unknown' ? 'IP não capturado. Verifique configuração de proxy/headers.' : undefined;

  return NextResponse.json({ ip, source, warning });
}