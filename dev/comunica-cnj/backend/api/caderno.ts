/**
 * API Route para obter metadados de caderno
 */

import { NextRequest, NextResponse } from 'next/server';
import { getComunicaCNJClient } from '@/lib/services/comunica-cnj-client';
import { MeioComunicacao } from '@/lib/types/comunica-cnj';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sigla: string; data: string; meio: string }> }
) {
  try {
    const { sigla, data, meio } = await params;

    // Validar sigla
    if (!sigla || sigla.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Sigla do tribunal inválida',
        },
        { status: 400 }
      );
    }

    // Validar formato de data (yyyy-mm-dd)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return NextResponse.json(
        {
          error: 'Data inválida. Use o formato yyyy-mm-dd',
        },
        { status: 422 }
      );
    }

    // Validar meio
    if (meio !== 'E' && meio !== 'D') {
      return NextResponse.json(
        {
          error: 'Meio inválido. Use "E" (Edital) ou "D" (Diário Eletrônico)',
        },
        { status: 422 }
      );
    }

    const client = getComunicaCNJClient();
    const caderno = await client.obterCaderno(sigla, data, meio as MeioComunicacao);

    return NextResponse.json(caderno, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('[GET /api/comunica-cnj/caderno/:sigla/:data/:meio] Error:', error);

    if (error instanceof Error) {
      if (error.message.includes('não encontrado')) {
        return NextResponse.json(
          {
            error: error.message,
          },
          { status: 404 }
        );
      }

      if (error.message.includes('inválid')) {
        return NextResponse.json(
          {
            error: error.message,
          },
          { status: 422 }
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
        error: 'Erro ao obter caderno',
      },
      { status: 500 }
    );
  }
}

