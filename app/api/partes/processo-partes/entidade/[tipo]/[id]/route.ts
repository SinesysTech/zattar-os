/**
 * API Route: /api/partes/processo-partes/entidade/[tipo]/[id]
 * Busca processos de uma entidade específica
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { buscarProcessosPorEntidade } from '@/backend/partes/services/processo-partes-persistence.service';
import type { BuscarProcessosPorEntidadeParams } from '@/backend/types/partes/processo-partes-types';

type RouteContext = {
  params: Promise<{
    tipo: string;
    id: string;
  }>;
};

/**
 * @swagger
 * /api/partes/processo-partes/entidade/{tipo}/{id}:
 *   get:
 *     summary: Busca processos de uma entidade
 *     description: Retorna todos os processos em que a entidade participa
 *     tags: [Processo-Partes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tipo
 *         required: true
 *         schema:
 *           type: string
 *           enum: [cliente, parte_contraria, terceiro]
 *         description: Tipo de entidade
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da entidade
 *     responses:
 *       200:
 *         description: Lista de processos da entidade
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProcessoParte'
 *       400:
 *         description: Parâmetros inválidos
 *       401:
 *         description: Não autorizado
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

    // Parse path parameters
    const { tipo, id } = await context.params;
    const entidadeId = parseInt(id);

    if (isNaN(entidadeId) || entidadeId <= 0) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    const validTipos = ['cliente', 'parte_contraria', 'terceiro'];
    if (!validTipos.includes(tipo)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de entidade inválido' },
        { status: 400 }
      );
    }

    const params: BuscarProcessosPorEntidadeParams = {
      tipo_entidade: tipo as BuscarProcessosPorEntidadeParams['tipo_entidade'],
      entidade_id: entidadeId,
    };

    // Find processos
    const processos = await buscarProcessosPorEntidade(params);

    return NextResponse.json({ success: true, data: processos }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar processos por entidade:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar processos por entidade' },
      { status: 500 }
    );
  }
}
