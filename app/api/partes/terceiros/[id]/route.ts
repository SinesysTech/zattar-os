/**
 * API Route: /api/partes/terceiros/[id]
 * Item endpoint - GET, PATCH, DELETE single terceiro
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  buscarTerceiroPorId,
  atualizarTerceiro,
  deletarTerceiro,
} from '@/backend/partes/services/terceiros-persistence.service';
import type { AtualizarTerceiroParams } from '@/backend/types/partes/terceiros-types';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * @swagger
 * /api/partes/terceiros/{id}:
 *   get:
 *     summary: Busca terceiro por ID
 *     tags: [Terceiros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do terceiro
 *     responses:
 *       200:
 *         description: Terceiro encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Terceiro'
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Terceiro não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // Authenticate
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Parse ID
    const { id } = await context.params;
    const terceiroId = parseInt(id);

    if (isNaN(terceiroId) || terceiroId <= 0) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Find terceiro
    const terceiro = await buscarTerceiroPorId(terceiroId);

    if (!terceiro) {
      return NextResponse.json(
        { success: false, error: 'Terceiro não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: terceiro }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar terceiro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar terceiro' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/partes/terceiros/{id}:
 *   patch:
 *     summary: Atualiza terceiro existente
 *     tags: [Terceiros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do terceiro
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome completo do terceiro
 *               tipo_parte:
 *                 type: string
 *                 description: Tipo de parte
 *             description: Campos tipo_pessoa e processo_id não podem ser alterados
 *     responses:
 *       200:
 *         description: Terceiro atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Terceiro'
 *       400:
 *         description: Dados inválidos ou campos imutáveis
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Terceiro não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    // Authenticate
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Parse ID
    const { id } = await context.params;
    const terceiroId = parseInt(id);

    if (isNaN(terceiroId) || terceiroId <= 0) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Check for immutable fields
    if ('tipo_pessoa' in body || 'processo_id' in body) {
      return NextResponse.json(
        { success: false, error: 'Campos tipo_pessoa e processo_id não podem ser alterados' },
        { status: 400 }
      );
    }

    const params: AtualizarTerceiroParams = {
      id: terceiroId,
      ...body,
    };

    // Update terceiro
    const result = await atualizarTerceiro(params);

    if (!result.sucesso) {
      if (result.erro?.includes('não encontrado')) {
        return NextResponse.json(
          { success: false, error: result.erro },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { success: false, error: result.erro },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: result.terceiro }, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar terceiro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar terceiro' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/partes/terceiros/{id}:
 *   delete:
 *     summary: Remove terceiro
 *     tags: [Terceiros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do terceiro
 *     responses:
 *       200:
 *         description: Terceiro removido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Terceiro não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    // Authenticate
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Parse ID
    const { id } = await context.params;
    const terceiroId = parseInt(id);

    if (isNaN(terceiroId) || terceiroId <= 0) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Delete terceiro
    const result = await deletarTerceiro(terceiroId);

    if (!result.sucesso) {
      if (result.erro?.includes('não encontrado')) {
        return NextResponse.json(
          { success: false, error: result.erro },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { success: false, error: result.erro },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Erro ao deletar terceiro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao deletar terceiro' },
      { status: 500 }
    );
  }
}
