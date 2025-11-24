/**
 * API Route: /api/partes/terceiros/processo
 * Busca terceiros de um processo específico
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
// TODO: Refactor to query via processo_partes JOIN
// import { buscarTerceirosPorProcesso } from '@/backend/partes/services/terceiros-persistence.service';
// import type { BuscarTerceirosPorProcessoParams } from '@/backend/types/partes/terceiros-types';

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

    // TODO: Refactor to query terceiros via JOIN with processo_partes
    // Since terceiros no longer has processo_id column,
    // need to query: processo_partes -> get entidade_id where tipo_entidade='terceiro' -> terceiros
    return NextResponse.json(
      { success: false, error: 'Endpoint temporariamente desabilitado - necessita refatoração' },
      { status: 501 }
    );
  } catch (error) {
    console.error('Erro ao buscar terceiros por processo:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar terceiros por processo' },
      { status: 500 }
    );
  }
}
