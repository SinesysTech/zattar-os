/**
 * API Routes para Item Específico de Orçamento
 * GET: Buscar item por ID
 * PUT: Atualizar item
 * DELETE: Excluir item
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  buscarOrcamentoComDetalhes,
  atualizarOrcamentoItem,
  deletarOrcamentoItem,
} from '@/backend/financeiro/orcamento/services/persistence/orcamento-persistence.service';
import { validarAtualizarOrcamentoItemDTO } from '@/backend/types/financeiro/orcamento.types';

interface RouteParams {
  params: Promise<{ id: string; itemId: string }>;
}

/**
 * @swagger
 * /api/financeiro/orcamentos/{id}/itens/{itemId}:
 *   get:
 *     summary: Busca item do orçamento
 *     description: Retorna um item específico do orçamento
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
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Item retornado com sucesso
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Item não encontrado
 *       500:
 *         description: Erro interno do servidor
 *   put:
 *     summary: Atualiza item do orçamento
 *     description: Atualiza os dados de um item do orçamento
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
 *       - in: path
 *         name: itemId
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
 *               planoContasId:
 *                 type: integer
 *               centroCustoId:
 *                 type: integer
 *               valorOrcado:
 *                 type: number
 *               descricao:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Item não encontrado
 *       500:
 *         description: Erro interno do servidor
 *   delete:
 *     summary: Exclui item do orçamento
 *     description: Remove um item do orçamento
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
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Item excluído com sucesso
 *       400:
 *         description: Item não pode ser excluído
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Item não encontrado
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

    // 2. Obter IDs
    const { id, itemId } = await params;
    const orcamentoId = parseInt(id, 10);
    const itemIdNum = parseInt(itemId, 10);

    if (isNaN(orcamentoId) || orcamentoId <= 0) {
      return NextResponse.json(
        { error: 'ID do orçamento inválido' },
        { status: 400 }
      );
    }

    if (isNaN(itemIdNum) || itemIdNum <= 0) {
      return NextResponse.json(
        { error: 'ID do item inválido' },
        { status: 400 }
      );
    }

    // 3. Buscar orçamento com itens
    const orcamento = await buscarOrcamentoComDetalhes(orcamentoId);

    if (!orcamento) {
      return NextResponse.json(
        { error: 'Orçamento não encontrado' },
        { status: 404 }
      );
    }

    // 4. Encontrar o item específico
    const item = orcamento.itens.find((i) => i.id === itemIdNum);

    if (!item) {
      return NextResponse.json(
        { error: 'Item não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Erro ao buscar item do orçamento:', error);
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

    // 2. Obter IDs
    const { id, itemId } = await params;
    const orcamentoId = parseInt(id, 10);
    const itemIdNum = parseInt(itemId, 10);

    if (isNaN(orcamentoId) || orcamentoId <= 0) {
      return NextResponse.json(
        { error: 'ID do orçamento inválido' },
        { status: 400 }
      );
    }

    if (isNaN(itemIdNum) || itemIdNum <= 0) {
      return NextResponse.json(
        { error: 'ID do item inválido' },
        { status: 400 }
      );
    }

    // 3. Obter dados do body
    const body = await request.json();

    // 4. Validar dados
    if (!validarAtualizarOrcamentoItemDTO(body)) {
      return NextResponse.json(
        {
          error:
            'Dados inválidos. Se fornecido, valorOrcado deve ser maior que 0.',
        },
        { status: 400 }
      );
    }

    // 5. Atualizar item
    const item = await atualizarOrcamentoItem(itemIdNum, body);

    return NextResponse.json({
      success: true,
      data: item,
      message: 'Item atualizado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao atualizar item do orçamento:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';

    if (erroMsg.includes('não encontrado')) {
      return NextResponse.json({ error: erroMsg }, { status: 404 });
    }

    if (
      erroMsg.includes('Apenas orçamentos em rascunho') ||
      erroMsg.includes('já existe') ||
      erroMsg.includes('inválido')
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

    // 2. Obter IDs
    const { id, itemId } = await params;
    const orcamentoId = parseInt(id, 10);
    const itemIdNum = parseInt(itemId, 10);

    if (isNaN(orcamentoId) || orcamentoId <= 0) {
      return NextResponse.json(
        { error: 'ID do orçamento inválido' },
        { status: 400 }
      );
    }

    if (isNaN(itemIdNum) || itemIdNum <= 0) {
      return NextResponse.json(
        { error: 'ID do item inválido' },
        { status: 400 }
      );
    }

    // 3. Deletar item
    await deletarOrcamentoItem(itemIdNum);

    return NextResponse.json({
      success: true,
      message: 'Item excluído com sucesso',
    });
  } catch (error) {
    console.error('Erro ao excluir item do orçamento:', error);
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
