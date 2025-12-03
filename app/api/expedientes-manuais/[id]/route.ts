/**
 * @swagger
 * /api/expedientes-manuais/{id}:
 *   get:
 *     summary: Busca expediente manual por ID
 *     description: Retorna os detalhes de um expediente manual específico
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
 *         description: Expediente encontrado
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
 *   patch:
 *     summary: Atualiza um expediente manual
 *     description: Atualiza os dados de um expediente manual existente
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
 *               descricao:
 *                 type: string
 *               tipo_expediente_id:
 *                 type: integer
 *               responsavel_id:
 *                 type: integer
 *               data_prazo_legal:
 *                 type: string
 *                 format: date-time
 *               observacoes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Expediente atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: Expediente não encontrado
 *   delete:
 *     summary: Deleta um expediente manual
 *     description: Remove um expediente manual do sistema
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
 *         description: Expediente deletado com sucesso
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
import {
  buscarExpedienteManualPorId,
  atualizarExpedienteManual,
  deletarExpedienteManual,
} from '@/backend/expedientes/services/persistence/expedientes-manuais-persistence.service';
import { AtualizarExpedienteManualParams } from '@/backend/types/expedientes-manuais/types';

/**
 * GET /api/expedientes-manuais/[id]
 * Buscar expediente manual por ID
 */
export async function GET(
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
      'visualizar'
    );
    if (!temPermissao) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para visualizar expedientes manuais' },
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

    // Buscar expediente
    const expediente = await buscarExpedienteManualPorId(expedienteId);

    if (!expediente) {
      return NextResponse.json(
        { success: false, error: 'Expediente não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: expediente }, { status: 200 });
  } catch (error) {
    console.error('[API] Erro ao buscar expediente manual:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro ao buscar expediente manual' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/expedientes-manuais/[id]
 * Atualizar expediente manual
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
      'editar'
    );
    if (!temPermissao) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para atualizar expedientes manuais' },
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
    const body: AtualizarExpedienteManualParams = await request.json();

    // Atualizar expediente
    const expediente = await atualizarExpedienteManual(expedienteId, body);

    return NextResponse.json({ success: true, data: expediente }, { status: 200 });
  } catch (error) {
    console.error('[API] Erro ao atualizar expediente manual:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro ao atualizar expediente manual' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/expedientes-manuais/[id]
 * Deletar expediente manual
 */
export async function DELETE(
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
      'deletar'
    );
    if (!temPermissao) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para deletar expedientes manuais' },
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

    // Deletar expediente
    await deletarExpedienteManual(expedienteId);

    return NextResponse.json(
      { success: true, message: 'Expediente deletado com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] Erro ao deletar expediente manual:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro ao deletar expediente manual' },
      { status: 500 }
    );
  }
}
