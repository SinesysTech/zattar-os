/**
 * API Routes para Conta a Pagar individual
 * GET: Buscar conta por ID
 * PUT: Atualizar conta
 * DELETE: Deletar/cancelar conta
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  buscarContaPagarPorId,
  atualizarContaPagar,
  deletarContaPagar,
} from '@/backend/financeiro/contas-pagar/services/persistence/contas-pagar-persistence.service';
import { cancelarContaPagar } from '@/backend/financeiro/contas-pagar/services/contas-pagar/cancelar-conta.service';
import { validarAtualizarContaPagarDTO } from '@/backend/types/financeiro/contas-pagar.types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/financeiro/contas-pagar/{id}:
 *   get:
 *     summary: Busca uma conta a pagar por ID
 *     description: Retorna os detalhes de uma conta a pagar específica
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
 *     responses:
 *       200:
 *         description: Conta a pagar encontrada
 *       404:
 *         description: Conta não encontrada
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 *   put:
 *     summary: Atualiza uma conta a pagar
 *     description: Atualiza os dados de uma conta a pagar pendente
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               descricao:
 *                 type: string
 *               valor:
 *                 type: number
 *               dataVencimento:
 *                 type: string
 *                 format: date
 *               categoria:
 *                 type: string
 *               observacoes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Conta atualizada com sucesso
 *       400:
 *         description: Dados inválidos ou conta não pode ser alterada
 *       404:
 *         description: Conta não encontrada
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 *   delete:
 *     summary: Cancela ou exclui uma conta a pagar
 *     description: Cancela uma conta pendente ou exclui permanentemente
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
 *       - in: query
 *         name: modo
 *         schema:
 *           type: string
 *           enum: [cancelar, excluir]
 *           default: cancelar
 *         description: Modo de operação (cancelar mantém histórico, excluir remove)
 *       - in: query
 *         name: motivo
 *         schema:
 *           type: string
 *         description: Motivo do cancelamento
 *     responses:
 *       200:
 *         description: Conta cancelada/excluída com sucesso
 *       400:
 *         description: Conta não pode ser cancelada/excluída
 *       404:
 *         description: Conta não encontrada
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: NextRequest, context: RouteParams) {
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

    // 3. Buscar conta
    const conta = await buscarContaPagarPorId(contaId);

    if (!conta) {
      return NextResponse.json(
        { error: 'Conta a pagar não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: conta,
    });
  } catch (error) {
    console.error('Erro ao buscar conta a pagar:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteParams) {
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
    if (!validarAtualizarContaPagarDTO(body)) {
      return NextResponse.json(
        { error: 'Dados inválidos. Forneça pelo menos um campo para atualizar.' },
        { status: 400 }
      );
    }

    // 5. Atualizar conta
    const contaAtualizada = await atualizarContaPagar(contaId, body);

    return NextResponse.json({
      success: true,
      data: contaAtualizada,
    });
  } catch (error) {
    console.error('Erro ao atualizar conta a pagar:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';

    // Erros de validação de negócio
    if (
      erroMsg.includes('não encontrad') ||
      erroMsg.includes('não é possível') ||
      erroMsg.includes('já paga') ||
      erroMsg.includes('cancelada')
    ) {
      const status = erroMsg.includes('não encontrad') ? 404 : 400;
      return NextResponse.json({ error: erroMsg }, { status });
    }

    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteParams) {
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

    // 3. Obter modo de operação
    const { searchParams } = new URL(request.url);
    const modo = searchParams.get('modo') || 'cancelar';
    const motivo = searchParams.get('motivo') || undefined;

    if (modo === 'excluir') {
      // 4a. Excluir permanentemente
      await deletarContaPagar(contaId);

      return NextResponse.json({
        success: true,
        message: 'Conta excluída com sucesso',
      });
    } else {
      // 4b. Cancelar (soft delete)
      const resultado = await cancelarContaPagar(contaId, { motivo });

      if (!resultado.sucesso) {
        return NextResponse.json(
          { error: resultado.erro },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: resultado.contaPagar,
        message: 'Conta cancelada com sucesso',
      });
    }
  } catch (error) {
    console.error('Erro ao deletar/cancelar conta a pagar:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';

    // Erros de validação de negócio
    if (
      erroMsg.includes('não encontrad') ||
      erroMsg.includes('não é possível') ||
      erroMsg.includes('pendente')
    ) {
      const status = erroMsg.includes('não encontrad') ? 404 : 400;
      return NextResponse.json({ error: erroMsg }, { status });
    }

    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
