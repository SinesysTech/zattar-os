/**
 * @swagger
 * /api/expedientes-manuais/{id}/reverter-baixa:
 *   post:
 *     summary: Reverte a baixa de um expediente manual
 *     description: Remove a marcação de concluído de um expediente manual
 *     tags:
 *       - Expedientes Manuais
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do expediente manual
 *     responses:
 *       200:
 *         description: Baixa revertida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: Expediente não encontrado
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { verificarPermissoes } from '@/backend/permissoes/services/persistence/permissao-persistence.service';
import { reverterBaixaExpedienteManual } from '@/backend/expedientes/services/persistence/expedientes-manuais-persistence.service';

/**
 * POST /api/expedientes-manuais/[id]/reverter-baixa
 * Reverter baixa de expediente manual
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.usuarioId) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Permissão
    const temPermissao = await verificarPermissoes(
      authResult.usuarioId,
      'expedientes_manuais',
      'reverter_baixa'
    );
    if (!temPermissao) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para reverter baixa de expedientes manuais' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const expedienteId = parseInt(id);

    if (isNaN(expedienteId)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Reverter baixa
    const expediente = await reverterBaixaExpedienteManual(expedienteId);

    return NextResponse.json({ success: true, data: expediente }, { status: 200 });
  } catch (error) {
    console.error('[API] Erro ao reverter baixa de expediente manual:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro ao reverter baixa de expediente manual' },
      { status: 500 }
    );
  }
}
