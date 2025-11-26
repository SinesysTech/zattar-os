/**
 * API Route: /api/representantes/[id]
 * Item endpoint - GET, PATCH, DELETE single representante
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  buscarRepresentante,
  atualizarRepresentante,
  deletarRepresentante,
} from '@/backend/representantes/services/representantes-persistence.service';
import type { AtualizarRepresentanteParams } from '@/backend/types/representantes/representantes-types';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * @swagger
 * /api/representantes/{id}:
 *   get:
 *     summary: Busca representante por ID
 *     tags: [Representantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do representante
 *     responses:
 *       200:
 *         description: Representante encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Representante'
 *       400:
 *         description: ID inválido
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Representante não encontrado
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
    const representanteId = parseInt(id);

    if (isNaN(representanteId) || representanteId <= 0) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Find representante
    const representante = await buscarRepresentante(representanteId);

    if (!representante) {
      return NextResponse.json(
        { success: false, error: 'Representante não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: representante }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar representante:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar representante' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/representantes/{id}:
 *   patch:
 *     summary: Atualiza representante existente
 *     tags: [Representantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do representante
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome completo do representante
 *               numero_oab:
 *                 type: string
 *                 description: Número da OAB
 *               uf_oab:
 *                 type: string
 *                 description: UF da OAB
 *               situacao_oab:
 *                 type: string
 *                 description: Situação da OAB
 *             description: Campos tipo_pessoa, parte_tipo e parte_id não podem ser alterados
 *     responses:
 *       200:
 *         description: Representante atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Representante'
 *       400:
 *         description: Dados inválidos ou campos imutáveis
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Representante não encontrado
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
    const representanteId = parseInt(id);

    if (isNaN(representanteId) || representanteId <= 0) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Check for immutable fields
    if ('tipo_pessoa' in body || 'parte_tipo' in body || 'parte_id' in body) {
      return NextResponse.json(
        { success: false, error: 'Campos tipo_pessoa, parte_tipo e parte_id não podem ser alterados' },
        { status: 400 }
      );
    }

    const params: AtualizarRepresentanteParams = {
      id: representanteId,
      ...body,
    };

    // Update representante
    const result = await atualizarRepresentante(params);

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

    return NextResponse.json({ success: true, data: result.representante }, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar representante:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar representante' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/representantes/{id}:
 *   delete:
 *     summary: Remove representante
 *     tags: [Representantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do representante
 *     responses:
 *       200:
 *         description: Representante removido com sucesso
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
 *         description: Representante não encontrado
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
    const representanteId = parseInt(id);

    if (isNaN(representanteId) || representanteId <= 0) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Delete representante
    const result = await deletarRepresentante(representanteId);

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
    console.error('Erro ao deletar representante:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao deletar representante' },
      { status: 500 }
    );
  }
}
