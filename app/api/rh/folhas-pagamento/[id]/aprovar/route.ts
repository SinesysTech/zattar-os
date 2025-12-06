/**
 * API Route para Aprovar Folha de Pagamento
 * POST: Aprova a folha e cria lançamentos financeiros
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { aprovarFolhaPagamento } from '@/backend/rh/salarios/services/folhas/aprovar-folha.service';
import { validarAprovarFolhaDTO } from '@/backend/types/financeiro/salarios.types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/rh/folhas-pagamento/{id}/aprovar:
 *   post:
 *     summary: Aprova uma folha de pagamento
 *     description: Aprova a folha e cria lançamentos financeiros para cada funcionário
 *     tags:
 *       - Folhas de Pagamento
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contaBancariaId
 *               - contaContabilId
 *             properties:
 *               contaBancariaId:
 *                 type: integer
 *                 description: ID da conta bancária para pagamento
 *               contaContabilId:
 *                 type: integer
 *                 description: ID da conta contábil de despesa (deve ser analítica)
 *               centroCustoId:
 *                 type: integer
 *                 description: ID do centro de custo (opcional)
 *               observacoes:
 *                 type: string
 *                 description: Observações adicionais
 *     responses:
 *       200:
 *         description: Folha aprovada com sucesso
 *       400:
 *         description: Dados inválidos ou folha não pode ser aprovada
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Folha não encontrada
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

    const usuarioId = authResult.usuarioId;
    if (!usuarioId) {
      return NextResponse.json(
        { error: 'Não foi possível identificar o usuário' },
        { status: 401 }
      );
    }

    // 2. Obter ID da folha
    const { id } = await params;
    const folhaId = parseInt(id, 10);

    if (isNaN(folhaId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // 3. Obter dados do body
    const body = await request.json();

    // 4. Validar dados
    const validacao = validarAprovarFolhaDTO(body);
    if (!validacao.valido) {
      return NextResponse.json(
        { error: validacao.erros.join('. ') },
        { status: 400 }
      );
    }

    // 5. Aprovar folha
    const folha = await aprovarFolhaPagamento(folhaId, body, usuarioId);

    return NextResponse.json({
      success: true,
      data: folha,
      message: `Folha aprovada com sucesso. ${folha.itens.length} lançamento(s) financeiro(s) criado(s).`,
    });
  } catch (error) {
    console.error('Erro ao aprovar folha de pagamento:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';

    if (erroMsg.includes('não encontrad')) {
      return NextResponse.json({ error: erroMsg }, { status: 404 });
    }

    if (
      erroMsg.includes('obrigatór') ||
      erroMsg.includes('inválid') ||
      erroMsg.includes('Apenas') ||
      erroMsg.includes('rascunho') ||
      erroMsg.includes('inativ') ||
      erroMsg.includes('sintética') ||
      erroMsg.includes('sem itens')
    ) {
      return NextResponse.json({ error: erroMsg }, { status: 400 });
    }

    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
