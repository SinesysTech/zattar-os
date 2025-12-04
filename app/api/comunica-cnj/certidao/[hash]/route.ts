/**
 * API Route para obtenção de certidão (PDF) de comunicação CNJ
 * GET: Retorna o PDF da certidão
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { obterCertidao } from '@/backend/comunica-cnj';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{
    hash: string;
  }>;
}

/**
 * @swagger
 * /api/comunica-cnj/certidao/{hash}:
 *   get:
 *     summary: Obtém certidão PDF de uma comunicação
 *     description: |
 *       Retorna o PDF da certidão de uma comunicação do CNJ.
 *       O hash é o identificador único da comunicação.
 *     tags:
 *       - Comunica CNJ
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: hash
 *         required: true
 *         schema:
 *           type: string
 *         description: Hash único da comunicação
 *     responses:
 *       200:
 *         description: PDF da certidão
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Hash inválido
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Certidão não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Obter hash da URL
    const { hash } = await params;

    if (!hash || hash.trim().length === 0) {
      return NextResponse.json({ error: 'Hash inválido' }, { status: 400 });
    }

    // 3. Obter certidão
    console.log('[GET /api/comunica-cnj/certidao] Obtendo certidão:', hash);

    const pdfBuffer = await obterCertidao(hash);

    // 4. Retornar PDF (criar novo Uint8Array para compatibilidade com BodyInit)
    // Usamos Uint8Array porque Buffer.buffer pode ser SharedArrayBuffer
    const uint8Array = new Uint8Array(pdfBuffer);
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="certidao-${hash}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'private, max-age=3600', // Cache 1 hora
      },
    });
  } catch (error) {
    console.error('[GET /api/comunica-cnj/certidao] Error:', error);

    if (error instanceof Error) {
      if (error.message.includes('não encontrada')) {
        return NextResponse.json(
          { error: 'Certidão não encontrada' },
          { status: 404 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'Erro ao obter certidão' },
      { status: 500 }
    );
  }
}
