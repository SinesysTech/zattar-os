/**
 * @swagger
 * /api/acordos-condenacoes/{id}:
 *   get:
 *     summary: Busca acordo/condenação por ID
 *     description: Retorna os detalhes de um acordo ou condenação específica, incluindo parcelas
 *     tags:
 *       - Acordos e Condenações
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do acordo/condenação
 *     responses:
 *       200:
 *         description: Acordo/condenação encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AcordoCondenacao'
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Acordo/condenação não encontrado
 *   put:
 *     summary: Atualiza um acordo/condenação
 *     description: Atualiza os dados de um acordo ou condenação existente
 *     tags:
 *       - Acordos e Condenações
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do acordo/condenação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [acordo, condenacao]
 *               valor_total:
 *                 type: number
 *               percentual_honorarios:
 *                 type: number
 *               data_transito_julgado:
 *                 type: string
 *                 format: date
 *               observacoes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Acordo/condenação atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Acordo/condenação não encontrado
 *   delete:
 *     summary: Deleta um acordo/condenação
 *     description: Remove um acordo ou condenação do sistema
 *     tags:
 *       - Acordos e Condenações
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do acordo/condenação
 *     responses:
 *       200:
 *         description: Acordo/condenação deletado com sucesso
 *       400:
 *         description: Erro ao deletar
 *       401:
 *         description: Não autenticado
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  buscarAcordoCondenacaoPorId,
  atualizarAcordoCondenacao,
  deletarAcordoCondenacao,
  type AcordoCondenacaoAtualizacaoDados,
} from '@/backend/acordos-condenacoes/services/persistence/acordo-condenacao-persistence.service';
import { listarParcelasDoAcordo } from '@/backend/acordos-condenacoes/services/persistence/parcela-persistence.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    const resultado = await buscarAcordoCondenacaoPorId(id);

    if (!resultado.sucesso) {
      return NextResponse.json({ error: resultado.erro }, { status: 404 });
    }

    // Buscar parcelas
    const parcelas = await listarParcelasDoAcordo(id);

    return NextResponse.json({
      success: true,
      data: {
        ...resultado.acordo,
        parcelas,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar acordo/condenação:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    const body = await request.json();
    const dados = body as AcordoCondenacaoAtualizacaoDados;

    const resultado = await atualizarAcordoCondenacao(id, dados);

    if (!resultado.sucesso) {
      return NextResponse.json({ error: resultado.erro }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: resultado.acordo });
  } catch (error) {
    console.error('Erro ao atualizar acordo/condenação:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    const resultado = await deletarAcordoCondenacao(id);

    if (!resultado.sucesso) {
      return NextResponse.json({ error: resultado.erro }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar acordo/condenação:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
