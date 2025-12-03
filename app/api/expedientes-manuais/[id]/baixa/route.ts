/**
 * @swagger
 * /api/expedientes-manuais/{id}/baixa:
 *   post:
 *     summary: Baixa um expediente manual
 *     description: Marca um expediente manual como concluído (requer protocolo OU justificativa)
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
 *               protocolo_id:
 *                 type: string
 *                 description: ID do protocolo (obrigatório se não tiver justificativa)
 *               justificativa_baixa:
 *                 type: string
 *                 description: Justificativa para baixa sem protocolo (obrigatório se não tiver protocolo)
 *     responses:
 *       200:
 *         description: Expediente baixado com sucesso
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
 *         description: Dados inválidos ou protocolo/justificativa ausentes
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
import { baixarExpedienteManual } from '@/backend/expedientes/services/persistence/expedientes-manuais-persistence.service';
import { BaixarExpedienteManualParams } from '@/backend/types/expedientes-manuais/types';

/**
 * POST /api/expedientes-manuais/[id]/baixa
 * Baixar expediente manual (concluir)
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
      'baixar_expediente'
    );
    if (!temPermissao) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para baixar expedientes manuais' },
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
    const body: BaixarExpedienteManualParams = await request.json();

    // Validação: protocolo_id OU justificativa_baixa obrigatória
    if (!body.protocolo_id && !body.justificativa_baixa) {
      return NextResponse.json(
        {
          success: false,
          error: 'É obrigatório informar o protocolo ou a justificativa para baixar o expediente',
        },
        { status: 400 }
      );
    }

    // Baixar expediente
    const expediente = await baixarExpedienteManual(expedienteId, body);

    return NextResponse.json({ success: true, data: expediente }, { status: 200 });
  } catch (error) {
    console.error('[API] Erro ao baixar expediente manual:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro ao baixar expediente manual' },
      { status: 500 }
    );
  }
}
