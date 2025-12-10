// Rota de API para remover processo do contrato

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { desassociarProcessoDoContrato } from '@/backend/contratos/services/contratos/gerenciar-processos.service';

/**
 * @swagger
 * /api/contratos/{id}/processos/{processoId}:
 *   delete:
 *     summary: Remove um processo do contrato
 *     tags:
 *       - Contratos
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
 *         description: ID do contrato
 *       - in: path
 *         name: processoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do processo na tabela acervo
 *     responses:
 *       200:
 *         description: Processo removido com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Associação não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; processoId: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, processoId } = await params;
    const contratoId = parseInt(id, 10);
    const processo = parseInt(processoId, 10);

    if (isNaN(contratoId) || isNaN(processo)) {
      return NextResponse.json({ error: 'IDs inválidos' }, { status: 400 });
    }

    const resultado = await desassociarProcessoDoContrato(contratoId, processo);

    if (!resultado.sucesso) {
      if (resultado.erro?.includes('não encontrada')) {
        return NextResponse.json({ error: resultado.erro }, { status: 404 });
      }
      return NextResponse.json(
        { error: resultado.erro || 'Erro ao remover processo do contrato' },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: resultado.contratoProcesso,
    });
  } catch (error) {
    console.error('Erro ao remover processo do contrato:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}

