// Rota de API para operações em vínculo específico de processo-parte
// GET: Buscar vínculo por ID | PATCH: Atualizar vínculo | DELETE: Desvincular

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  buscarProcessoPartePorId,
  atualizarProcessoParte,
  desvincularParteProcesso,
} from '@/backend/processo-partes/services/persistence/processo-partes-persistence.service';
import type { AtualizarProcessoParteParams } from '@/backend/types/partes';

/**
 * @swagger
 * /api/processo-partes/{id}:
 *   get:
 *     summary: Busca um vínculo processo-parte por ID
 *     tags:
 *       - Processo-Partes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Vínculo encontrado
 *       404:
 *         description: Vínculo não encontrado
 *   patch:
 *     summary: Atualiza detalhes de um vínculo (ordem, principal, etc.)
 *     tags:
 *       - Processo-Partes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Vínculo atualizado
 *   delete:
 *     summary: Desvincula uma parte de um processo
 *     tags:
 *       - Processo-Partes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Vínculo removido
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
    const vinculoId = parseInt(id, 10);

    if (isNaN(vinculoId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const vinculo = await buscarProcessoPartePorId(vinculoId);

    if (!vinculo) {
      return NextResponse.json({ error: 'Vínculo não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: vinculo,
    });
  } catch (error) {
    console.error('Erro ao buscar vínculo:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const vinculoId = parseInt(id, 10);

    if (isNaN(vinculoId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const dadosAtualizacao = body as Omit<AtualizarProcessoParteParams, 'id'>;

    const resultado = await atualizarProcessoParte({ id: vinculoId, ...dadosAtualizacao });

    if (!resultado.success) {
      if (resultado.error?.includes('não encontrado')) {
        return NextResponse.json({ error: resultado.error }, { status: 404 });
      }
      return NextResponse.json(
        { error: resultado.error || 'Erro ao atualizar vínculo' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: resultado.data,
    });
  } catch (error) {
    console.error('Erro ao atualizar vínculo:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
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

    const { id } = await params;
    const vinculoId = parseInt(id, 10);

    if (isNaN(vinculoId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const resultado = await desvincularParteProcesso({ id: vinculoId });

    if (!resultado.success) {
      if (resultado.error?.includes('não encontrado')) {
        return NextResponse.json({ error: resultado.error }, { status: 404 });
      }
      return NextResponse.json(
        { error: resultado.error || 'Erro ao desvincular' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: resultado.data,
    });
  } catch (error) {
    console.error('Erro ao desvincular parte do processo:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
