/**
 * API Route: /api/partes/processo-partes/processo/[processo_id]
 * Busca partes de um processo específico
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { buscarPartesPorProcesso } from '@/backend/partes/services/processo-partes-persistence.service';
import type { BuscarPartesPorProcessoParams } from '@/backend/types/partes/processo-partes-types';

type RouteContext = {
  params: Promise<{
    processo_id: string;
  }>;
};

/**
 * @swagger
 * /api/partes/processo-partes/processo/{processo_id}:
 *   get:
 *     summary: Busca partes de um processo
 *     description: Retorna todas as partes vinculadas a um processo, ordenadas por polo, principal e ordem
 *     tags: [Processo-Partes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: processo_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do processo
 *       - in: query
 *         name: polo
 *         schema:
 *           type: string
 *           enum: [ATIVO, PASSIVO, NEUTRO, TERCEIRO]
 *         description: Filtrar por polo processual
 *     responses:
 *       200:
 *         description: Lista de partes do processo
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
 *         description: ID inválido
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
    const { processo_id } = await context.params;
    const processoId = parseInt(processo_id);

    if (isNaN(processoId) || processoId <= 0) {
      return NextResponse.json(
        { success: false, error: 'processo_id inválido' },
        { status: 400 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const params: BuscarPartesPorProcessoParams = {
      processo_id: processoId,
      polo: searchParams.get('polo') as BuscarPartesPorProcessoParams['polo'],
    };

    // Find partes
    const partes = await buscarPartesPorProcesso(params);

    return NextResponse.json({ success: true, data: partes }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar partes por processo:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar partes por processo' },
      { status: 500 }
    );
  }
}
