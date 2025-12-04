/**
 * API Route para listagem de tribunais do CNJ
 * GET: Retorna lista de tribunais disponíveis na API do CNJ
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { listarTribunais } from '@/backend/comunica-cnj';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/comunica-cnj/tribunais:
 *   get:
 *     summary: Lista tribunais disponíveis na API do CNJ
 *     description: |
 *       Retorna a lista de tribunais que possuem comunicações
 *       disponíveis na API pública do CNJ.
 *     tags:
 *       - Comunica CNJ
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de tribunais
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     tribunais:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           nome:
 *                             type: string
 *                           sigla:
 *                             type: string
 *                           jurisdicao:
 *                             type: string
 *                           ultimaAtualizacao:
 *                             type: string
 *                             format: date-time
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Listar tribunais
    console.log('[GET /api/comunica-cnj/tribunais] Listando tribunais...');

    const tribunais = await listarTribunais();

    console.log(
      '[GET /api/comunica-cnj/tribunais] Tribunais obtidos:',
      tribunais.length
    );

    // 3. Retornar resposta
    return NextResponse.json(
      {
        success: true,
        data: {
          tribunais,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600', // Cache 1 hora
        },
      }
    );
  } catch (error) {
    console.error('[GET /api/comunica-cnj/tribunais] Error:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'Erro ao listar tribunais' },
      { status: 500 }
    );
  }
}
