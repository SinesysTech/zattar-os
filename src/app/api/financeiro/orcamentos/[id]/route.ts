/**
 * API Routes para Orçamento Individual
 * GET: Buscar orçamento por ID
 * PUT: Atualizar orçamento
 * DELETE: Deletar orçamento (apenas rascunho)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  buscarOrcamentoComDetalhes,
  atualizarOrcamento,
  deletarOrcamento,
} from '@/backend/financeiro/orcamento/services/persistence/orcamento-persistence.service';
import { validarAtualizarOrcamentoDTO } from '@/backend/types/financeiro/orcamento.types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/financeiro/orcamentos/{id}:
 *   get:
 *     summary: Busca orçamento por ID
 *     description: Retorna os detalhes completos de um orçamento
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
 *         description: Orçamento encontrado
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Orçamento não encontrado
 *       500:
 *         description: Erro interno do servidor
 *   put:
 *     summary: Atualiza orçamento
 *     description: Atualiza os dados de um orçamento existente
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               descricao:
 *                 type: string
 *               dataInicio:
 *                 type: string
 *                 format: date
 *               dataFim:
 *                 type: string
 *                 format: date
 *               observacoes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Orçamento atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Orçamento não encontrado
 *       500:
 *         description: Erro interno do servidor
 *   delete:
 *     summary: Deleta orçamento
 *     description: Remove um orçamento (apenas rascunhos podem ser deletados)
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
 *         description: Orçamento deletado com sucesso
 *       400:
 *         description: Orçamento não pode ser deletado
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Orçamento não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Obter ID do orçamento
    const { id } = await params;
    const orcamentoId = parseInt(id, 10);

    if (isNaN(orcamentoId) || orcamentoId <= 0) {
      return NextResponse.json(
        { error: 'ID do orçamento inválido' },
        { status: 400 }
      );
    }

    // 3. Buscar orçamento
    const orcamento = await buscarOrcamentoComDetalhes(orcamentoId);

    if (!orcamento) {
      return NextResponse.json(
        { error: 'Orçamento não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: orcamento,
    });
  } catch (error) {
    console.error('Erro ao buscar orçamento:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Obter ID do orçamento
    const { id } = await params;
    const orcamentoId = parseInt(id, 10);

    if (isNaN(orcamentoId) || orcamentoId <= 0) {
      return NextResponse.json(
        { error: 'ID do orçamento inválido' },
        { status: 400 }
      );
    }

    // 3. Obter dados do body
    const body = await request.json();

    // 4. Validar dados
    if (!validarAtualizarOrcamentoDTO(body)) {
      return NextResponse.json(
        { error: 'Dados inválidos. Forneça pelo menos um campo para atualizar.' },
        { status: 400 }
      );
    }

    // 5. Atualizar orçamento
    const orcamento = await atualizarOrcamento(orcamentoId, body);

    return NextResponse.json({
      success: true,
      data: orcamento,
    });
  } catch (error) {
    console.error('Erro ao atualizar orçamento:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';

    if (erroMsg.includes('não encontrado')) {
      return NextResponse.json({ error: erroMsg }, { status: 404 });
    }

    if (
      erroMsg.includes('Não é possível') ||
      erroMsg.includes('encerrado') ||
      erroMsg.includes('em execução')
    ) {
      return NextResponse.json({ error: erroMsg }, { status: 400 });
    }

    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Obter ID do orçamento
    const { id } = await params;
    const orcamentoId = parseInt(id, 10);

    if (isNaN(orcamentoId) || orcamentoId <= 0) {
      return NextResponse.json(
        { error: 'ID do orçamento inválido' },
        { status: 400 }
      );
    }

    // 3. Deletar orçamento
    await deletarOrcamento(orcamentoId);

    return NextResponse.json({
      success: true,
      message: 'Orçamento deletado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar orçamento:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';

    if (erroMsg.includes('não encontrado')) {
      return NextResponse.json({ error: erroMsg }, { status: 404 });
    }

    if (erroMsg.includes('Apenas orçamentos em rascunho')) {
      return NextResponse.json({ error: erroMsg }, { status: 400 });
    }

    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
