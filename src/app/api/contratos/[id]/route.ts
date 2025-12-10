// Rota de API para operações em contrato específico
// GET: Buscar contrato por ID | PATCH: Atualizar contrato

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { obterContratoPorId } from '@/backend/contratos/services/contratos/buscar-contrato.service';
import { atualizarContrato } from '@/backend/contratos/services/contratos/atualizar-contrato.service';
import type { ContratoDados } from '@/backend/contratos/services/persistence/contrato-persistence.service';

/**
 * @swagger
 * /api/contratos/{id}:
 *   get:
 *     summary: Busca um contrato por ID
 *     description: Retorna os dados completos de um contrato específico
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
 *     responses:
 *       200:
 *         description: Contrato encontrado
 *       404:
 *         description: Contrato não encontrado
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 *   patch:
 *     summary: Atualiza um contrato parcialmente
 *     description: Atualiza campos específicos de um contrato existente
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
 *             description: Campos a atualizar
 *     responses:
 *       200:
 *         description: Contrato atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Contrato não encontrado
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

    const contrato = await obterContratoPorId(contratoId);

    if (!contrato) {
      return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: contrato,
    });
  } catch (error) {
    console.error('Erro ao buscar contrato:', error);
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
    const contratoId = parseInt(id, 10);

    if (isNaN(contratoId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const dadosAtualizacao = body as Partial<ContratoDados>;

    const resultado = await atualizarContrato(contratoId, dadosAtualizacao);

    if (!resultado.sucesso) {
      if (resultado.erro?.includes('não encontrado')) {
        return NextResponse.json({ error: resultado.erro }, { status: 404 });
      }
      return NextResponse.json(
        { error: resultado.erro || 'Erro ao atualizar contrato' },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: resultado.contrato,
    });
  } catch (error) {
    console.error('Erro ao atualizar contrato:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}

