// Rota de API para processos vinculados a um contrato
// GET: Listar processos | POST: Associar processo

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  obterProcessosDoContrato,
  associarProcessoAoContrato,
} from '@/backend/contratos/services/contratos/gerenciar-processos.service';
import type { ListarContratoProcessosParams } from '@/backend/contratos/services/persistence/contrato-processo-persistence.service';

/**
 * @swagger
 * /api/contratos/{id}/processos:
 *   get:
 *     summary: Lista processos vinculados a um contrato
 *     tags:
 *       - Contratos
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
 *         description: ID do contrato
 *       - in: query
 *         name: pagina
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Lista de processos retornada com sucesso
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 *   post:
 *     summary: Associa um processo ao contrato
 *     tags:
 *       - Contratos
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
 *         description: ID do contrato
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - processoId
 *             properties:
 *               processoId:
 *                 type: integer
 *                 description: ID do processo na tabela acervo
 *     responses:
 *       201:
 *         description: Processo associado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const contratoId = parseInt(id, 10);

    if (isNaN(contratoId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const listarParams: ListarContratoProcessosParams = {
      contratoId,
      pagina: searchParams.get('pagina') ? parseInt(searchParams.get('pagina')!, 10) : undefined,
      limite: searchParams.get('limite') ? parseInt(searchParams.get('limite')!, 10) : undefined,
    };

    const resultado = await obterProcessosDoContrato(listarParams);

    return NextResponse.json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    console.error('Erro ao listar processos do contrato:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const contratoId = parseInt(id, 10);

    if (isNaN(contratoId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const { processoId } = body as { processoId?: number };

    if (!processoId || isNaN(processoId)) {
      return NextResponse.json({ error: 'processoId é obrigatório' }, { status: 400 });
    }

    const resultado = await associarProcessoAoContrato(contratoId, processoId);

    if (!resultado.sucesso) {
      return NextResponse.json(
        { error: resultado.erro || 'Erro ao associar processo ao contrato' },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: resultado.contratoProcesso,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Erro ao associar processo ao contrato:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}

