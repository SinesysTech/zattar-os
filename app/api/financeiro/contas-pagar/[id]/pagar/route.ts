/**
 * API Route para Pagamento de Conta a Pagar
 * POST: Efetuar pagamento de uma conta
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { pagarContaPagar } from '@/backend/financeiro/contas-pagar/services/contas-pagar/pagar-conta.service';
import { validarPagarContaPagarDTO } from '@/backend/types/financeiro/contas-pagar.types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/financeiro/contas-pagar/{id}/pagar:
 *   post:
 *     summary: Efetua o pagamento de uma conta a pagar
 *     description: Confirma o pagamento de uma conta pendente, atualizando status para confirmado
 *     tags:
 *       - Contas a Pagar
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
 *         description: ID da conta a pagar
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
 *                 enum: [dinheiro, transferencia_bancaria, ted, pix, boleto, cartao_credito, cartao_debito, cheque, deposito_judicial]
 *                 description: Forma de pagamento utilizada
 *               contaBancariaId:
 *                 type: integer
 *                 description: ID da conta bancária de onde saiu o pagamento
 *               dataEfetivacao:
 *                 type: string
 *                 format: date-time
 *                 description: Data e hora da efetivação do pagamento (default: agora)
 *               observacoes:
 *                 type: string
 *                 description: Observações sobre o pagamento
 *               comprovante:
 *                 type: object
 *                 description: Dados do comprovante anexado
 *                 properties:
 *                   nome:
 *                     type: string
 *                   url:
 *                     type: string
 *                   tipo:
 *                     type: string
 *                   tamanho:
 *                     type: number
 *     responses:
 *       200:
 *         description: Pagamento efetuado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Dados da conta atualizada
 *                 detalhes:
 *                   type: object
 *                   description: Detalhes do pagamento
 *       400:
 *         description: Dados inválidos ou conta não pode ser paga
 *       404:
 *         description: Conta não encontrada
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function POST(request: NextRequest, context: RouteParams) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Obter ID da URL
    const { id } = await context.params;
    const contaId = parseInt(id, 10);

    if (isNaN(contaId) || contaId <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // 3. Obter dados do body
    const body = await request.json();

    // 4. Validar dados
    if (!validarPagarContaPagarDTO(body)) {
      return NextResponse.json(
        {
          error: 'Dados inválidos. Campos obrigatórios: formaPagamento, contaBancariaId',
        },
        { status: 400 }
      );
    }

    // 5. Efetuar pagamento
    const resultado = await pagarContaPagar(contaId, body, authResult.usuarioId);

    if (!resultado.sucesso) {
      // Determinar status code baseado no erro
      const status = resultado.erro?.includes('não encontrad') ? 404 : 400;
      return NextResponse.json(
        { error: resultado.erro },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      data: resultado.contaPagar,
      detalhes: resultado.detalhes,
      message: 'Pagamento efetuado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao efetuar pagamento:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
