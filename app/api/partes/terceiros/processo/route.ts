/**
 * API Route: /api/partes/terceiros/processo
 * Busca terceiros de um processo específico
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import { buscarTerceirosPorProcesso } from '@/backend/partes/services/terceiros-persistence.service';
import type { BuscarTerceirosPorProcessoParams } from '@/backend/types/partes/terceiros-types';

/**
 * @swagger
 * /api/partes/terceiros/processo:
 *   get:
 *     summary: Busca terceiros de um processo
 *     tags: [Terceiros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: processo_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do processo
 *       - in: query
 *         name: tipo_parte
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de parte
 *       - in: query
 *         name: tipo_pessoa
 *         schema:
 *           type: string
 *           enum: [pf, pj]
 *         description: Filtrar por tipo de pessoa
 *     responses:
 *       200:
 *         description: Lista de terceiros do processo
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
 *                     $ref: '#/components/schemas/Terceiro'
 *       400:
 *         description: Parâmetros inválidos
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const processoIdStr = searchParams.get('processo_id');

    if (!processoIdStr) {
      return NextResponse.json(
        { success: false, error: 'processo_id é obrigatório' },
        { status: 400 }
      );
    }

    const processoId = parseInt(processoIdStr);
    if (isNaN(processoId) || processoId <= 0) {
      return NextResponse.json(
        { success: false, error: 'processo_id inválido' },
        { status: 400 }
      );
    }

    const params: BuscarTerceirosPorProcessoParams = {
      processo_id: processoId,
      tipo_parte: searchParams.get('tipo_parte') || undefined,
      tipo_pessoa: searchParams.get('tipo_pessoa') as any,
    };

    // Find terceiros
    const terceiros = await buscarTerceirosPorProcesso(params);

    return NextResponse.json({ success: true, data: terceiros }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar terceiros por processo:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar terceiros por processo' },
      { status: 500 }
    );
  }
}
