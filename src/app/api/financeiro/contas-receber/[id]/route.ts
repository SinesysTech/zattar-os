/**
 * API Routes para Conta a Receber Individual
 * GET: Buscar conta por ID
 * PUT: Atualizar conta
 * DELETE: Cancelar ou excluir conta
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  buscarContaReceberPorId,
  atualizarContaReceber,
  deletarContaReceber,
} from '@/backend/financeiro/contas-receber/services/persistence/contas-receber-persistence.service';
import { cancelarContaReceber } from '@/backend/financeiro/contas-receber/services/contas-receber/cancelar-conta.service';
import { validarAtualizarContaReceberDTO } from '@/backend/types/financeiro/contas-receber.types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/financeiro/contas-receber/{id}:
 *   get:
 *     summary: Busca uma conta a receber por ID
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
 *     responses:
 *       200:
 *         description: Conta a receber encontrada
 *       404:
 *         description: Conta não encontrada
 *       401:
 *         description: Não autenticado
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // 3. Buscar conta
    const conta = await buscarContaReceberPorId(contaId);

    if (!conta) {
      return NextResponse.json(
        { error: 'Conta a receber não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: conta,
    });
  } catch (error) {
    console.error('Erro ao buscar conta a receber:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/financeiro/contas-receber/{id}:
 *   put:
 *     summary: Atualiza uma conta a receber
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
 *     responses:
 *       200:
 *         description: Conta atualizada com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Conta não encontrada
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    // 3. Obter e validar dados do body
    const body = await request.json();

    if (!validarAtualizarContaReceberDTO(body)) {
      return NextResponse.json(
        { error: 'Dados inválidos para atualização' },
        { status: 400 }
      );
    }

    // 4. Atualizar conta
    const contaAtualizada = await atualizarContaReceber(contaId, body);

    return NextResponse.json({
      success: true,
      data: contaAtualizada,
    });
  } catch (error) {
    console.error('Erro ao atualizar conta a receber:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';

    // Verificar tipo de erro para status code apropriado
    if (erroMsg.includes('não encontrad')) {
      return NextResponse.json({ error: erroMsg }, { status: 404 });
    }
    if (erroMsg.includes('não é possível') || erroMsg.includes('já')) {
      return NextResponse.json({ error: erroMsg }, { status: 400 });
    }

    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/financeiro/contas-receber/{id}:
 *   delete:
 *     summary: Cancela ou exclui uma conta a receber
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
 *       - in: query
 *         name: modo
 *         schema:
 *           type: string
 *           enum: [cancelar, excluir]
 *           default: cancelar
 *       - in: query
 *         name: motivo
 *         schema:
 *           type: string
 *         description: Motivo do cancelamento
 *     responses:
 *       200:
 *         description: Conta cancelada ou excluída com sucesso
 *       400:
 *         description: Operação não permitida
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Conta não encontrada
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Obter ID da conta e parâmetros
    const { id } = await params;
    const contaId = parseInt(id, 10);

    if (isNaN(contaId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const modo = searchParams.get('modo') || 'cancelar';
    const motivo = searchParams.get('motivo') || undefined;

    // 3. Executar operação baseada no modo
    if (modo === 'excluir') {
      await deletarContaReceber(contaId);
      return NextResponse.json({
        success: true,
        message: 'Conta excluída com sucesso',
      });
    } else {
      // Modo padrão: cancelar
      const resultado = await cancelarContaReceber(contaId, { motivo });

      if (!resultado.sucesso) {
        return NextResponse.json(
          { error: resultado.erro },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: resultado.contaReceber,
        message: 'Conta cancelada com sucesso',
      });
    }
  } catch (error) {
    console.error('Erro ao excluir/cancelar conta a receber:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';

    // Verificar tipo de erro para status code apropriado
    if (erroMsg.includes('não encontrad')) {
      return NextResponse.json({ error: erroMsg }, { status: 404 });
    }
    if (erroMsg.includes('não é possível') || erroMsg.includes('apenas')) {
      return NextResponse.json({ error: erroMsg }, { status: 400 });
    }

    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
