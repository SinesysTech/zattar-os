/**
 * API Routes para Itens de Orçamento
 * GET: Listar itens de um orçamento
 * POST: Criar novo item no orçamento
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  buscarOrcamentoComDetalhes,
  criarOrcamentoItem,
  criarItensEmLote,
} from '@/backend/financeiro/orcamento/services/persistence/orcamento-persistence.service';
import { validarCriarOrcamentoItemDTO } from '@/backend/types/financeiro/orcamento.types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/financeiro/orcamentos/{id}/itens:
 *   get:
 *     summary: Lista itens do orçamento
 *     description: Retorna todos os itens de um orçamento específico
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
 *         description: Lista de itens retornada com sucesso
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Orçamento não encontrado
 *       500:
 *         description: Erro interno do servidor
 *   post:
 *     summary: Cria um novo item no orçamento
 *     description: Adiciona um novo item ao orçamento. Suporta criação individual ou em lote.
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
 *             oneOf:
 *               - type: object
 *                 required:
 *                   - planoContasId
 *                   - valorOrcado
 *                 properties:
 *                   planoContasId:
 *                     type: integer
 *                   centroCustoId:
 *                     type: integer
 *                   valorOrcado:
 *                     type: number
 *                   descricao:
 *                     type: string
 *               - type: object
 *                 required:
 *                   - itens
 *                 properties:
 *                   itens:
 *                     type: array
 *                     items:
 *                       type: object
 *     responses:
 *       201:
 *         description: Item(s) criado(s) com sucesso
 *       400:
 *         description: Dados inválidos
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

    // 3. Buscar orçamento com itens
    const orcamento = await buscarOrcamentoComDetalhes(orcamentoId);

    if (!orcamento) {
      return NextResponse.json(
        { error: 'Orçamento não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: orcamento.itens,
    });
  } catch (error) {
    console.error('Erro ao listar itens do orçamento:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';
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

    // 4. Obter dados do body
    const body = await request.json();

    // 5. Verificar se é criação em lote ou individual
    if (body.itens && Array.isArray(body.itens)) {
      // Criação em lote
      const itensParaCriar = body.itens.map((item: Record<string, unknown>) => ({
        ...item,
        orcamentoId,
      }));

      // Validar cada item
      for (const item of itensParaCriar) {
        if (!validarCriarOrcamentoItemDTO(item)) {
          return NextResponse.json(
            { error: 'Um ou mais itens possuem dados inválidos' },
            { status: 400 }
          );
        }
      }

      const itensCriados = await criarItensEmLote(orcamentoId, itensParaCriar);

      return NextResponse.json(
        {
          success: true,
          data: itensCriados,
          message: `${itensCriados.length} itens criados com sucesso`,
        },
        { status: 201 }
      );
    } else {
      // Criação individual
      const itemData = {
        ...body,
      };

      if (!validarCriarOrcamentoItemDTO(itemData)) {
        return NextResponse.json(
          {
            error:
              'Dados inválidos. Campos obrigatórios: contaContabilId, valorOrcado (maior que 0)',
          },
          { status: 400 }
        );
      }

      const item = await criarOrcamentoItem(orcamentoId, itemData);

      return NextResponse.json(
        {
          success: true,
          data: item,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Erro ao criar item do orçamento:', error);
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
