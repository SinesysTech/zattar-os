/**
 * API Route para Recebimento de Conta a Receber
 * POST: Efetuar recebimento de uma conta
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { receberContaReceber } from '@/backend/financeiro/contas-receber/services/contas-receber/receber-conta.service';
import { validarReceberContaReceberDTO } from '@/backend/types/financeiro/contas-receber.types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/financeiro/contas-receber/{id}/receber:
 *   post:
 *     summary: Efetua o recebimento de uma conta a receber
 *     description: Confirma o recebimento de uma conta, atualizando seu status para 'confirmado'
 *     tags:
 *       - Contas a Receber
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
 *         description: ID da conta a receber
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - formaRecebimento
 *               - contaBancariaId
 *             properties:
 *               formaRecebimento:
 *                 type: string
 *                 enum: [dinheiro, transferencia_bancaria, ted, pix, boleto, cartao_credito, cartao_debito, cheque, deposito_judicial]
 *               contaBancariaId:
 *                 type: integer
 *               dataEfetivacao:
 *                 type: string
 *                 format: date-time
 *               observacoes:
 *                 type: string
 *               comprovante:
 *                 type: object
 *                 properties:
 *                   nome:
 *                     type: string
 *                   url:
 *                     type: string
 *                   tipo:
 *                     type: string
 *                   tamanho:
 *                     type: integer
 *     responses:
 *       200:
 *         description: Recebimento efetuado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 detalhes:
 *                   type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Dados inválidos ou operação não permitida
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Conta não encontrada
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

    // 2. Obter ID da conta
    const { id } = await params;
    const contaId = parseInt(id, 10);

    if (isNaN(contaId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // 3. Obter ID do usuário
    const usuarioId = authResult.usuarioId;

    // 4. Obter e validar dados do body
    const body = await request.json();

    if (!validarReceberContaReceberDTO(body)) {
      return NextResponse.json(
        {
          error:
            'Dados inválidos. Campos obrigatórios: formaRecebimento, contaBancariaId',
        },
        { status: 400 }
      );
    }

    // 5. Efetuar recebimento
    const resultado = await receberContaReceber(contaId, body, usuarioId);

    if (!resultado.sucesso) {
      // Determinar status code baseado no erro
      const statusCode = resultado.erro?.includes('não encontrad') ? 404 : 400;
      return NextResponse.json(
        { error: resultado.erro },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      data: resultado.contaReceber,
      detalhes: resultado.detalhes,
      message: 'Recebimento efetuado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao efetuar recebimento:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';

    // Verificar tipo de erro para status code apropriado
    if (erroMsg.includes('não encontrad')) {
      return NextResponse.json({ error: erroMsg }, { status: 404 });
    }
    if (
      erroMsg.includes('não é possível') ||
      erroMsg.includes('apenas') ||
      erroMsg.includes('já')
    ) {
      return NextResponse.json({ error: erroMsg }, { status: 400 });
    }

    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
