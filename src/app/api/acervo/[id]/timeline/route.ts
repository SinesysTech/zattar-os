/**
 * GET /api/acervo/:id/timeline
 *
 * Obtém a timeline completa de um processo, incluindo dados do MongoDB.
 * Suporta modo unificado que agrega timelines de todas as instâncias do processo.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { actionObterTimelinePorId } from '@/features/acervo/actions/acervo-actions';

/**
 * @swagger
 * /api/acervo/{id}/timeline:
 *   get:
 *     tags:
 *       - Acervo
 *     summary: Obtém timeline do processo
 *     description: |
 *       Retorna os dados do acervo (PostgreSQL) combinados com a timeline completa (MongoDB).
 *       A timeline inclui movimentos, documentos e links para armazenamento.
 *
 *       **Modo Unificado (unified=true):**
 *       - Agrega timelines de todas as instâncias do processo (1º grau, 2º grau, TST)
 *       - Remove eventos duplicados automaticamente
 *       - Inclui metadados sobre a origem de cada evento
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do acervo
 *       - in: query
 *         name: unified
 *         schema:
 *           type: boolean
 *           default: false
 *         description: |
 *           Se true, retorna timeline unificada de todas as instâncias do processo.
 *           Se false (padrão), retorna apenas a timeline da instância especificada.
 *     responses:
 *       200:
 *         description: Timeline obtida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     acervo:
 *                       type: object
 *                       description: Dados do processo (PostgreSQL)
 *                     timeline:
 *                       type: object
 *                       description: Timeline completa (MongoDB)
 *                       properties:
 *                         timeline:
 *                           type: array
 *                           description: Array de itens da timeline
 *                         metadata:
 *                           type: object
 *                           description: Metadados da timeline
 *       404:
 *         description: Acervo ou timeline não encontrado
 *       401:
 *         description: Não autenticado
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Autenticar requisição
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const acervoId = parseInt(id);

    if (isNaN(acervoId)) {
      return NextResponse.json(
        { error: 'ID do acervo inválido' },
        { status: 400 }
      );
    }

    // 2. Verificar parâmetro unified
    const { searchParams } = new URL(request.url);
    const unified = searchParams.get('unified') === 'true';

    console.log('[GET /api/acervo/:id/timeline] Buscando dados', { acervoId, unified });

    // 3. Usar Server Action para obter timeline
    const result = await actionObterTimelinePorId(acervoId, unified);

    if (!result.success) {
      const status = result.error === 'Acervo não encontrado' ? 404 : 500;
      return NextResponse.json(
        { error: result.error },
        { status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/acervo/:id/timeline] Erro:', error);

    const mensagem = error instanceof Error ? error.message : 'Erro ao obter timeline';

    return NextResponse.json(
      { error: mensagem },
      { status: 500 }
    );
  }
}
