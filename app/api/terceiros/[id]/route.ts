// Rota de API para operações em terceiro específico
// GET: Buscar terceiro por ID | PATCH: Atualizar terceiro | DELETE: Deletar terceiro

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  buscarTerceiroPorId,
  atualizarTerceiro,
  deletarTerceiro,
} from '@/backend/terceiros/services/persistence/terceiro-persistence.service';
import type { AtualizarTerceiroParams } from '@/backend/types/partes';

/**
 * @swagger
 * /api/terceiros/{id}:
 *   get:
 *     summary: Busca um terceiro por ID
 *     tags:
 *       - Terceiros
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Terceiro encontrado
 *       404:
 *         description: Terceiro não encontrado
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
    const terceiroId = parseInt(id, 10);

    if (isNaN(terceiroId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const terceiro = await buscarTerceiroPorId(terceiroId);

    if (!terceiro) {
      return NextResponse.json({ error: 'Terceiro não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: terceiro,
    });
  } catch (error) {
    console.error('Erro ao buscar terceiro:', error);
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
    const terceiroId = parseInt(id, 10);

    if (isNaN(terceiroId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const dadosAtualizacao = body as Omit<AtualizarTerceiroParams, 'id'>;

    const resultado = await atualizarTerceiro({ id: terceiroId, ...dadosAtualizacao });

    if (!resultado.sucesso) {
      if (resultado.erro?.includes('não encontrado')) {
        return NextResponse.json({ error: resultado.erro }, { status: 404 });
      }
      return NextResponse.json(
        { error: resultado.erro || 'Erro ao atualizar terceiro' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: resultado.terceiro,
    });
  } catch (error) {
    console.error('Erro ao atualizar terceiro:', error);
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
    const terceiroId = parseInt(id, 10);

    if (isNaN(terceiroId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const resultado = await deletarTerceiro(terceiroId);

    if (!resultado.sucesso) {
      if (resultado.erro?.includes('não encontrado')) {
        return NextResponse.json({ error: resultado.erro }, { status: 404 });
      }
      return NextResponse.json(
        { error: resultado.erro || 'Erro ao deletar terceiro' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: resultado.terceiro,
    });
  } catch (error) {
    console.error('Erro ao deletar terceiro:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
