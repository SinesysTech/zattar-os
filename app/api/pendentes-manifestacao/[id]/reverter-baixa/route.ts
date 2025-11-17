// Rota de API para reverter baixa de expediente pendente de manifestação
// PATCH: Reverter baixa (marcar como pendente novamente)

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import { reverterBaixa } from '@/backend/pendentes/services/reverter-baixa.service';

/**
 * @swagger
 * /api/pendentes-manifestacao/{id}/reverter-baixa:
 *   patch:
 *     summary: Reverte a baixa de um expediente pendente de manifestação
 *     description: |
 *       Reverte a baixa de um expediente, marcando-o como pendente novamente.
 *       Limpa os campos baixado_em, protocolo_id e justificativa_baixa.
 *       
 *       Todas as alterações são automaticamente registradas em logs_alteracao.
 *     tags:
 *       - Pendentes de Manifestação
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do expediente pendente de manifestação
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
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     baixado_em:
 *                       type: null
 *                     protocolo_id:
 *                       type: null
 *                     justificativa_baixa:
 *                       type: null
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Expediente não encontrado ou não está baixado
 *       500:
 *         description: Erro interno do servidor
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Obter ID do expediente
    const { id } = await params;
    const expedienteId = parseInt(id, 10);

    if (isNaN(expedienteId)) {
      return NextResponse.json(
        { error: 'ID do expediente inválido' },
        { status: 400 }
      );
    }

    // 3. Obter ID do usuário que está executando a ação
    let usuarioId: number;
    if (authResult.userId === 'system') {
      usuarioId = 10; // Sistema usa ID padrão do Super Administrador
    } else {
      const userIdNum = parseInt(authResult.userId, 10);
      if (isNaN(userIdNum)) {
        return NextResponse.json(
          { error: 'ID de usuário inválido' },
          { status: 401 }
        );
      }
      usuarioId = userIdNum;
    }

    // 4. Reverter baixa
    const resultado = await reverterBaixa({
      expedienteId,
      usuarioId,
    });

    if (!resultado.success) {
      const statusCode =
        resultado.error?.includes('não encontrado') ||
        resultado.error?.includes('não está baixado')
          ? 404
          : 500;
      return NextResponse.json(
        { error: resultado.error || 'Erro ao reverter baixa' },
        { status: statusCode }
      );
    }

    // 5. Retornar resultado
    return NextResponse.json({
      success: true,
      data: resultado.data,
    });
  } catch (error) {
    console.error('Erro ao reverter baixa:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}

