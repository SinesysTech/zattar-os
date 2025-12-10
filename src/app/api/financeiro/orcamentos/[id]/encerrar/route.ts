/**
 * API Route para Encerrar Orçamento
 * POST: Encerra um orçamento em execução
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { encerrarOrcamento } from '@/backend/financeiro/orcamento/services/persistence/orcamento-persistence.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/financeiro/orcamentos/{id}/encerrar:
 *   post:
 *     summary: Encerra um orçamento
 *     description: Encerra um orçamento que está em execução
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
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               observacoes:
 *                 type: string
 *                 description: Observações sobre o encerramento
 *     responses:
 *       200:
 *         description: Orçamento encerrado com sucesso
 *       400:
 *         description: Orçamento não pode ser encerrado
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

    // 4. Obter observações do body (opcional)
    let observacoes: string | undefined;
    try {
      const body = await request.json();
      observacoes = body.observacoes;
    } catch {
      // Body vazio é permitido
    }

    // 5. Encerrar orçamento
    const orcamento = await encerrarOrcamento(orcamentoId, usuarioId, observacoes);

    return NextResponse.json({
      success: true,
      data: orcamento,
      message: 'Orçamento encerrado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao encerrar orçamento:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';

    if (erroMsg.includes('não encontrado')) {
      return NextResponse.json({ error: erroMsg }, { status: 404 });
    }

    if (erroMsg.includes('Apenas orçamentos em execução')) {
      return NextResponse.json({ error: erroMsg }, { status: 400 });
    }

    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
