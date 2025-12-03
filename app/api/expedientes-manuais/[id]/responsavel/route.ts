/**
 * @swagger
 * /api/expedientes-manuais/{id}/responsavel:
 *   patch:
 *     summary: Atribui responsável a expediente manual
 *     description: Atribui ou remove o responsável de um expediente manual
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               responsavel_id:
 *                 type: integer
 *                 nullable: true
 *                 description: ID do novo responsável (null para remover)
 *     responses:
 *       200:
 *         description: Responsável atribuído/removido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Dados inválidos
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
import { atribuirResponsavelExpedienteManual } from '@/backend/expedientes/services/persistence/expedientes-manuais-persistence.service';

/**
 * PATCH /api/expedientes-manuais/[id]/responsavel
 * Atribuir ou remover responsável de expediente manual
 */
export async function PATCH(
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
      'atribuir_responsavel'
    );
    if (!temPermissao) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para atribuir responsável em expedientes manuais' },
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

    // Body da requisição
    const body = await request.json();
    const responsavel_id =
      body.responsavel_id === null ? null : parseInt(body.responsavel_id);

    // Atribuir responsável
    const expediente = await atribuirResponsavelExpedienteManual(
      expedienteId,
      responsavel_id
    );

    return NextResponse.json({ success: true, data: expediente }, { status: 200 });
  } catch (error) {
    console.error('[API] Erro ao atribuir responsável a expediente manual:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atribuir responsável a expediente manual',
      },
      { status: 500 }
    );
  }
}
