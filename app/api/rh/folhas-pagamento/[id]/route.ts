/**
 * API Routes para Folha de Pagamento Individual
 * GET: Buscar folha por ID
 * PUT: Atualizar folha (apenas rascunho)
 * DELETE: Cancelar ou excluir folha
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  buscarFolhaPorId,
  atualizarFolhaPagamento,
  deletarFolhaPagamento,
} from '@/backend/rh/salarios/services/persistence/folhas-pagamento-persistence.service';
import { cancelarFolhaPagamento, podeCancelarFolha } from '@/backend/rh/salarios/services/folhas/cancelar-folha.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/rh/folhas-pagamento/{id}:
 *   get:
 *     summary: Busca folha de pagamento por ID
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
 *         description: Folha encontrada
 *       404:
 *         description: Folha não encontrada
 *       401:
 *         description: Não autenticado
 *   put:
 *     summary: Atualiza folha de pagamento
 *     description: Atualiza dados de uma folha em rascunho
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
 *             properties:
 *               dataPagamento:
 *                 type: string
 *                 format: date
 *               observacoes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Folha atualizada
 *       400:
 *         description: Folha não está em rascunho
 *       404:
 *         description: Folha não encontrada
 *   delete:
 *     summary: Cancela ou exclui folha de pagamento
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
 *       - in: query
 *         name: modo
 *         schema:
 *           type: string
 *           enum: [cancelar, excluir, verificar]
 *           default: cancelar
 *       - in: query
 *         name: motivo
 *         schema:
 *           type: string
 *         description: Motivo do cancelamento
 *     responses:
 *       200:
 *         description: Operação realizada com sucesso
 *       400:
 *         description: Folha não pode ser cancelada/excluída
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

    const folha = await buscarFolhaPorId(folhaId);

    if (!folha) {
      return NextResponse.json(
        { error: 'Folha de pagamento não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: folha,
    });
  } catch (error) {
    console.error('Erro ao buscar folha de pagamento:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const body = await request.json();

    const folha = await atualizarFolhaPagamento(folhaId, {
      dataPagamento: body.dataPagamento,
      observacoes: body.observacoes,
    });

    return NextResponse.json({
      success: true,
      data: folha,
    });
  } catch (error) {
    console.error('Erro ao atualizar folha de pagamento:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';

    if (erroMsg.includes('não encontrad')) {
      return NextResponse.json({ error: erroMsg }, { status: 404 });
    }

    if (
      erroMsg.includes('rascunho') ||
      erroMsg.includes('não pode') ||
      erroMsg.includes('Apenas')
    ) {
      return NextResponse.json({ error: erroMsg }, { status: 400 });
    }

    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { searchParams } = new URL(request.url);
    const modo = searchParams.get('modo') || 'cancelar';
    const motivo = searchParams.get('motivo') || undefined;

    // Modo verificar: apenas retorna se pode cancelar
    if (modo === 'verificar') {
      const resultado = await podeCancelarFolha(folhaId);
      return NextResponse.json({
        success: true,
        data: resultado,
      });
    }

    // Modo cancelar: cancela a folha (e lançamentos se aprovada)
    if (modo === 'cancelar') {
      const folha = await cancelarFolhaPagamento(folhaId, motivo, authResult.usuarioId);
      return NextResponse.json({
        success: true,
        data: folha,
        message: 'Folha cancelada com sucesso',
      });
    }

    // Modo excluir: exclui a folha (apenas rascunho)
    if (modo === 'excluir') {
      await deletarFolhaPagamento(folhaId);
      return NextResponse.json({
        success: true,
        message: 'Folha excluída com sucesso',
      });
    }

    return NextResponse.json(
      { error: 'Modo inválido. Use: cancelar, excluir ou verificar' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Erro ao processar folha de pagamento:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';

    if (erroMsg.includes('não encontrad')) {
      return NextResponse.json({ error: erroMsg }, { status: 404 });
    }

    if (
      erroMsg.includes('não pode') ||
      erroMsg.includes('Não é possível') ||
      erroMsg.includes('Apenas') ||
      erroMsg.includes('já está')
    ) {
      return NextResponse.json({ error: erroMsg }, { status: 400 });
    }

    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
