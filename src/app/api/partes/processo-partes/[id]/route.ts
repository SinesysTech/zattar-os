/**
 * API Route: /api/partes/processo-partes/[id]
 * Item endpoint - GET, PATCH, DELETE (desvincular) single processo-parte
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  buscarProcessoPartePorId,
  atualizarProcessoParte,
  desvincularParteProcesso,
} from '@/backend/partes/services/processo-partes-persistence.service';
import type { AtualizarProcessoParteParams } from '@/backend/types/partes/processo-partes-types';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * @swagger
 * /api/partes/processo-partes/{id}:
 *   get:
 *     summary: Busca vínculo processo-parte por ID
 *     tags: [Processo-Partes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do vínculo
 *     responses:
 *       200:
 *         description: Vínculo encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ProcessoParte'
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Vínculo não encontrado
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
    const processoParteId = parseInt(id);

    if (isNaN(processoParteId) || processoParteId <= 0) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Find processo-parte
    const processoParte = await buscarProcessoPartePorId(processoParteId);

    if (!processoParte) {
      return NextResponse.json(
        { success: false, error: 'Vínculo não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: processoParte }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar vínculo processo-parte:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar vínculo processo-parte' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/partes/processo-partes/{id}:
 *   patch:
 *     summary: Atualiza vínculo processo-parte existente
 *     tags: [Processo-Partes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do vínculo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tipo_parte:
 *                 type: string
 *                 description: Tipo de participante
 *               polo:
 *                 type: string
 *                 enum: [ATIVO, PASSIVO, NEUTRO, TERCEIRO]
 *                 description: Polo processual
 *               principal:
 *                 type: boolean
 *                 description: Indica se é a parte principal no polo
 *               ordem:
 *                 type: integer
 *                 description: Ordem de exibição dentro do polo
 *             description: Campos tipo_entidade, entidade_id e processo_id não podem ser alterados
 *     responses:
 *       200:
 *         description: Vínculo atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ProcessoParte'
 *       400:
 *         description: Dados inválidos ou campos imutáveis
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Vínculo não encontrado
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
    const processoParteId = parseInt(id);

    if (isNaN(processoParteId) || processoParteId <= 0) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Check for immutable fields
    if ('tipo_entidade' in body || 'entidade_id' in body || 'processo_id' in body) {
      return NextResponse.json(
        { success: false, error: 'Campos tipo_entidade, entidade_id e processo_id não podem ser alterados' },
        { status: 400 }
      );
    }

    const params: AtualizarProcessoParteParams = {
      id: processoParteId,
      ...body,
    };

    // Update processo-parte
    const result = await atualizarProcessoParte(params);

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

    return NextResponse.json({ success: true, data: result.processoParte }, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar vínculo processo-parte:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar vínculo processo-parte' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/partes/processo-partes/{id}:
 *   delete:
 *     summary: Desvincula parte de processo
 *     tags: [Processo-Partes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do vínculo
 *     responses:
 *       200:
 *         description: Vínculo removido com sucesso
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
 *         description: Vínculo não encontrado
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
    const processoParteId = parseInt(id);

    if (isNaN(processoParteId) || processoParteId <= 0) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Desvincular parte
    const result = await desvincularParteProcesso({ id: processoParteId });

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
    console.error('Erro ao desvincular parte de processo:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao desvincular parte de processo' },
      { status: 500 }
    );
  }
}
