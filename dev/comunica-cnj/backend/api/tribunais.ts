/**
 * API Route para listar tribunais do Comunica CNJ
 */

import { NextResponse } from 'next/server';
import { getComunicaCNJClient } from '@/lib/services/comunica-cnj-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = getComunicaCNJClient();
    const tribunais = await client.listarTribunais();

    return NextResponse.json(
      {
        tribunais,
        total: tribunais.length,
        ultimaAtualizacao: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600',
        },
      }
    );
  } catch (error) {
    console.error('[GET /api/comunica-cnj/tribunais] Error:', error);

    if (error instanceof Error) {
      // Se API externa indisponível
      if (error.message.includes('network') || error.message.includes('timeout')) {
        return NextResponse.json(
          {
            error: 'API externa indisponível',
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Erro ao listar tribunais',
      },
      { status: 500 }
    );
  }
}

