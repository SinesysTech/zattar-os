/**
 * API Route para Iniciar Execução de Orçamento
 * POST: Inicia a execução de um orçamento aprovado
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { iniciarExecucao } from '@/backend/financeiro/orcamento/services/persistence/orcamento-persistence.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/financeiro/orcamentos/{id}/iniciar-execucao:
 *   post:
 *     summary: Inicia execução de um orçamento
 *     description: Inicia a execução de um orçamento que está aprovado
 *     tags:
 *       - Orçamentos
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
 *     responses:
 *       200:
 *         description: Execução iniciada com sucesso
 *       400:
 *         description: Orçamento não pode ser iniciado
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Orçamento não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Obter ID do usuário autenticado
    const usuarioId = authResult.usuarioId;
    if (!usuarioId) {
      return NextResponse.json(
        { error: 'Não foi possível identificar o usuário' },
        { status: 401 }
      );
    }

    // 3. Obter ID do orçamento
    const { id } = await params;
    const orcamentoId = parseInt(id, 10);

    if (isNaN(orcamentoId) || orcamentoId <= 0) {
      return NextResponse.json(
        { error: 'ID do orçamento inválido' },
        { status: 400 }
      );
    }

    // 4. Iniciar execução
    const orcamento = await iniciarExecucao(orcamentoId, usuarioId);

    return NextResponse.json({
      success: true,
      data: orcamento,
      message: 'Execução do orçamento iniciada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao iniciar execução do orçamento:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';

    if (erroMsg.includes('não encontrado')) {
      return NextResponse.json({ error: erroMsg }, { status: 404 });
    }

    if (erroMsg.includes('Apenas orçamentos aprovados')) {
      return NextResponse.json({ error: erroMsg }, { status: 400 });
    }

    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
