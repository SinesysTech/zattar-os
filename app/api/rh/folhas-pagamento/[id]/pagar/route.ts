/**
 * API Route para Pagar Folha de Pagamento
 * POST: Paga a folha e confirma os lançamentos financeiros
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { pagarFolhaPagamento, calcularTotalAPagar } from '@/backend/rh/salarios/services/folhas/pagar-folha.service';
import { validarPagarFolhaDTO } from '@/backend/types/financeiro/salarios.types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/rh/folhas-pagamento/{id}/pagar:
 *   post:
 *     summary: Paga uma folha de pagamento
 *     description: Confirma o pagamento da folha e marca os lançamentos como pagos
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
 *               - formaPagamento
 *               - contaBancariaId
 *             properties:
 *               formaPagamento:
 *                 type: string
 *                 enum: [transferencia_bancaria, ted, pix, deposito, dinheiro]
 *               contaBancariaId:
 *                 type: integer
 *               dataEfetivacao:
 *                 type: string
 *                 format: date
 *                 description: Data de efetivação do pagamento (default=hoje)
 *               observacoes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Folha paga com sucesso
 *       400:
 *         description: Dados inválidos ou folha não pode ser paga
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Folha não encontrada
 *       500:
 *         description: Erro interno do servidor
 *   get:
 *     summary: Retorna resumo para pagamento
 *     description: Retorna totais e informações para confirmar o pagamento
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
 *     responses:
 *       200:
 *         description: Resumo retornado
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Folha não encontrada
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const folhaId = parseInt(id, 10);

    if (isNaN(folhaId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const resumo = await calcularTotalAPagar(folhaId);

    return NextResponse.json({
      success: true,
      data: resumo,
    });
  } catch (error) {
    console.error('Erro ao calcular total a pagar:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';

    if (erroMsg.includes('não encontrad')) {
      return NextResponse.json({ error: erroMsg }, { status: 404 });
    }

    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}

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
    const validacao = validarPagarFolhaDTO(body);
    if (!validacao.valido) {
      return NextResponse.json(
        { error: validacao.erros.join('. ') },
        { status: 400 }
      );
    }

    // 5. Pagar folha
    const folha = await pagarFolhaPagamento(folhaId, body, usuarioId);

    return NextResponse.json({
      success: true,
      data: folha,
      message: `Folha paga com sucesso. ${folha.itens.length} lançamento(s) confirmado(s).`,
    });
  } catch (error) {
    console.error('Erro ao pagar folha de pagamento:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';

    if (erroMsg.includes('não encontrad')) {
      return NextResponse.json({ error: erroMsg }, { status: 404 });
    }

    if (
      erroMsg.includes('obrigatór') ||
      erroMsg.includes('inválid') ||
      erroMsg.includes('Apenas') ||
      erroMsg.includes('aprovada') ||
      erroMsg.includes('inativ') ||
      erroMsg.includes('sem lançamento')
    ) {
      return NextResponse.json({ error: erroMsg }, { status: 400 });
    }

    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
