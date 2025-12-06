/**
 * API Routes para Salário Individual
 * GET: Buscar salário por ID
 * PUT: Atualizar salário
 * DELETE: Encerrar vigência ou inativar salário
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  buscarSalarioPorId,
  atualizarSalario,
  encerrarVigenciaSalario,
  inativarSalario,
  deletarSalario,
} from '@/backend/rh/salarios/services/persistence/salarios-persistence.service';
import { validarAtualizarSalarioDTO } from '@/backend/types/financeiro/salarios.types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/rh/salarios/{id}:
 *   get:
 *     summary: Busca salário por ID
 *     tags:
 *       - Salários
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
 *         description: Salário encontrado
 *       404:
 *         description: Salário não encontrado
 *       401:
 *         description: Não autenticado
 *   put:
 *     summary: Atualiza salário
 *     tags:
 *       - Salários
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
 *               salarioBruto:
 *                 type: number
 *               cargoId:
 *                 type: integer
 *               dataFimVigencia:
 *                 type: string
 *                 format: date
 *               observacoes:
 *                 type: string
 *               ativo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Salário atualizado
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Salário não encontrado
 *   delete:
 *     summary: Encerra vigência, inativa ou exclui salário
 *     tags:
 *       - Salários
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
 *           enum: [encerrar, inativar, excluir]
 *           default: encerrar
 *       - in: query
 *         name: dataFim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim da vigência (para modo=encerrar)
 *     responses:
 *       200:
 *         description: Operação realizada com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Salário não encontrado
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const salarioId = parseInt(id, 10);

    if (isNaN(salarioId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const salario = await buscarSalarioPorId(salarioId);

    if (!salario) {
      return NextResponse.json(
        { error: 'Salário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: salario,
    });
  } catch (error) {
    console.error('Erro ao buscar salário:', error);
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
    const salarioId = parseInt(id, 10);

    if (isNaN(salarioId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();

    // Validar dados
    const validacao = validarAtualizarSalarioDTO(body);
    if (!validacao.valido) {
      return NextResponse.json(
        { error: validacao.erros.join('. ') },
        { status: 400 }
      );
    }

    const salario = await atualizarSalario(salarioId, body);

    return NextResponse.json({
      success: true,
      data: salario,
    });
  } catch (error) {
    console.error('Erro ao atualizar salário:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';

    if (erroMsg.includes('não encontrad')) {
      return NextResponse.json({ error: erroMsg }, { status: 404 });
    }

    if (
      erroMsg.includes('inválid') ||
      erroMsg.includes('não pode') ||
      erroMsg.includes('Não é possível')
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
    const salarioId = parseInt(id, 10);

    if (isNaN(salarioId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const modo = searchParams.get('modo') || 'encerrar';

    if (modo === 'encerrar') {
      const dataFim = searchParams.get('dataFim');
      if (!dataFim) {
        return NextResponse.json(
          { error: 'Data de fim é obrigatória para encerrar vigência' },
          { status: 400 }
        );
      }

      const salario = await encerrarVigenciaSalario(salarioId, dataFim);
      return NextResponse.json({
        success: true,
        data: salario,
        message: 'Vigência encerrada com sucesso',
      });
    }

    if (modo === 'inativar') {
      const salario = await inativarSalario(salarioId);
      return NextResponse.json({
        success: true,
        data: salario,
        message: 'Salário inativado com sucesso',
      });
    }

    if (modo === 'excluir') {
      await deletarSalario(salarioId);
      return NextResponse.json({
        success: true,
        message: 'Salário excluído com sucesso',
      });
    }

    return NextResponse.json(
      { error: 'Modo inválido. Use: encerrar, inativar ou excluir' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Erro ao processar salário:', error);
    const erroMsg =
      error instanceof Error ? error.message : 'Erro interno do servidor';

    if (erroMsg.includes('não encontrad')) {
      return NextResponse.json({ error: erroMsg }, { status: 404 });
    }

    if (
      erroMsg.includes('não pode') ||
      erroMsg.includes('Não é possível') ||
      erroMsg.includes('já foi')
    ) {
      return NextResponse.json({ error: erroMsg }, { status: 400 });
    }

    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
