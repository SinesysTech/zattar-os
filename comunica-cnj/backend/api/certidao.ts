/**
 * API Route para obter certidão de comunicação
 */

import { NextRequest, NextResponse } from 'next/server';
import { getComunicaCNJClient } from '@/lib/services/comunica-cnj-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const { hash } = await params;

    if (!hash || hash.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Hash inválido',
        },
        { status: 400 }
      );
    }

    const client = getComunicaCNJClient();
    console.log('[GET /api/comunica-cnj/certidao/:hash] Obtendo certidão para hash:', hash);
    const certidao = await client.obterCertidao(hash);

    console.log('[GET /api/comunica-cnj/certidao/:hash] Certidão recebida:', {
      isBuffer: Buffer.isBuffer(certidao),
      length: certidao?.length || 0,
      type: typeof certidao,
    });

    // Verificar se recebemos dados válidos (Buffer em Node.js)
    if (!certidao || (Buffer.isBuffer(certidao) && certidao.length === 0)) {
      console.error('[GET /api/comunica-cnj/certidao/:hash] Certidão vazia ou inválida');
      return NextResponse.json(
        {
          error: 'Certidão vazia ou inválida',
        },
        { status: 500 }
      );
    }

    // Garantir que temos um Buffer válido
    const pdfData = Buffer.isBuffer(certidao) ? certidao : Buffer.from(certidao as any);

    console.log('[GET /api/comunica-cnj/certidao/:hash] Enviando PDF:', {
      length: pdfData.length,
      contentType: 'application/pdf',
    });

    return new NextResponse(pdfData, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': pdfData.length.toString(),
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'Content-Disposition': `inline; filename="certidao-${hash}.pdf"`,
      },
    });
  } catch (error) {
    console.error('[GET /api/comunica-cnj/certidao/:hash] Error:', error);

    if (error instanceof Error) {
      if (error.message.includes('não encontrada')) {
        return NextResponse.json(
          {
            error: error.message,
          },
          { status: 404 }
        );
      }

      if (error.message.includes('inválido')) {
        return NextResponse.json(
          {
            error: error.message,
          },
          { status: 400 }
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
        error: 'Erro ao obter certidão',
      },
      { status: 500 }
    );
  }
}

