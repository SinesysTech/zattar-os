// Rota de API para Plano de Contas por ID
// GET: Buscar conta | PUT: Atualizar conta | DELETE: Desativar conta

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { obterPlanoContaPorId } from '@/backend/plano-contas/services/plano-contas/listar-plano-contas.service';
import {
  atualizarPlanoConta,
  desativarPlanoConta,
  ativarPlanoConta,
  deletarPlanoConta,
} from '@/backend/plano-contas/services/plano-contas/gerenciar-plano-contas.service';
import { validarAtualizarPlanoContaDTO } from '@/backend/types/financeiro/plano-contas.types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/plano-contas/{id}:
 *   get:
 *     summary: Busca uma conta por ID
 *     description: Retorna os detalhes de uma conta específica
 *     tags:
 *       - Plano de Contas
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
 *         description: ID da conta
 *     responses:
 *       200:
 *         description: Conta encontrada com sucesso
 *       404:
 *         description: Conta não encontrada
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 *   put:
 *     summary: Atualiza uma conta existente
 *     description: Atualiza os dados de uma conta do plano de contas
 *     tags:
 *       - Plano de Contas
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
 *               tipoConta:
 *                 type: string
 *                 enum: [ativo, passivo, receita, despesa, patrimonio_liquido]
 *               natureza:
 *                 type: string
 *                 enum: [devedora, credora]
 *               contaPaiId:
 *                 type: integer
 *               ordemExibicao:
 *                 type: integer
 *               ativo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Conta atualizada com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Conta não encontrada
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 *   delete:
 *     summary: Desativa uma conta
 *     description: Desativa uma conta (soft delete). Use PUT com ativo=true para reativar.
 *     tags:
 *       - Plano de Contas
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
 *         name: permanente
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Se true, deleta permanentemente (se não houver dependências)
 *     responses:
 *       200:
 *         description: Conta desativada/deletada com sucesso
 *       400:
 *         description: Conta possui dependências
 *       404:
 *         description: Conta não encontrada
 *       401:
 *         description: Não autenticado
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

    // 2. Obter ID
    const { id } = await params;
    const contaId = parseInt(id, 10);

    if (isNaN(contaId) || contaId <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // 3. Buscar conta
    const conta = await obterPlanoContaPorId(contaId);

    if (!conta) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: conta,
    });
  } catch (error) {
    console.error('Erro ao buscar conta:', error);
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

    // 2. Obter ID
    const { id } = await params;
    const contaId = parseInt(id, 10);

    if (isNaN(contaId) || contaId <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // 3. Obter dados do body
    const body = await request.json();

    // 4. Validar dados
    if (!validarAtualizarPlanoContaDTO(body)) {
      return NextResponse.json(
        { error: 'Dados inválidos ou nenhuma alteração fornecida' },
        { status: 400 }
      );
    }

    // 5. Atualizar conta
    const conta = await atualizarPlanoConta(contaId, body);

    return NextResponse.json({
      success: true,
      data: conta,
    });
  } catch (error) {
    console.error('Erro ao atualizar conta:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';

    if (erroMsg.includes('não encontrada')) {
      return NextResponse.json({ error: erroMsg }, { status: 404 });
    }

    if (
      erroMsg.includes('já existe') ||
      erroMsg.includes('inválido') ||
      erroMsg.includes('sintética') ||
      erroMsg.includes('ciclo')
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

    // 2. Obter ID
    const { id } = await params;
    const contaId = parseInt(id, 10);

    if (isNaN(contaId) || contaId <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // 3. Verificar se é deleção permanente
    const { searchParams } = new URL(request.url);
    const permanente = searchParams.get('permanente') === 'true';

    // 4. Desativar ou deletar conta
    if (permanente) {
      await deletarPlanoConta(contaId);
    } else {
      await desativarPlanoConta(contaId);
    }

    return NextResponse.json({
      success: true,
      message: permanente ? 'Conta deletada com sucesso' : 'Conta desativada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao desativar/deletar conta:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';

    if (erroMsg.includes('não encontrada')) {
      return NextResponse.json({ error: erroMsg }, { status: 404 });
    }

    if (erroMsg.includes('filhas') || erroMsg.includes('lançamentos')) {
      return NextResponse.json({ error: erroMsg }, { status: 400 });
    }

    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}

/**
 * PATCH para alternar status ativo/inativo
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Obter ID
    const { id } = await params;
    const contaId = parseInt(id, 10);

    if (isNaN(contaId) || contaId <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // 3. Obter ação do body
    const body = await request.json();
    const { ativo } = body;

    if (typeof ativo !== 'boolean') {
      return NextResponse.json(
        { error: 'Campo ativo deve ser um boolean' },
        { status: 400 }
      );
    }

    // 4. Ativar ou desativar conta
    if (ativo) {
      await ativarPlanoConta(contaId);
    } else {
      await desativarPlanoConta(contaId);
    }

    return NextResponse.json({
      success: true,
      message: ativo ? 'Conta ativada com sucesso' : 'Conta desativada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao alternar status da conta:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';

    if (erroMsg.includes('não encontrada')) {
      return NextResponse.json({ error: erroMsg }, { status: 404 });
    }

    if (erroMsg.includes('filhas') || erroMsg.includes('pai')) {
      return NextResponse.json({ error: erroMsg }, { status: 400 });
    }

    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
