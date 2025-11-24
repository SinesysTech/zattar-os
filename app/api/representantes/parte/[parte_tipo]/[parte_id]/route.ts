/**
 * API Route: /api/representantes/parte/[parte_tipo]/[parte_id]
 * Query representantes by party
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import { buscarRepresentantesPorParte } from '@/backend/representantes/services/representantes-persistence.service';
import type { BuscarRepresentantesPorParteParams, ParteTipo, Grau } from '@/backend/types/representantes/representantes-types';

type RouteContext = {
  params: Promise<{
    parte_tipo: string;
    parte_id: string;
  }>;
};

/**
 * @swagger
 * /api/representantes/parte/{parte_tipo}/{parte_id}:
 *   get:
 *     summary: Busca todos os representantes de uma parte específica
 *     tags: [Representantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parte_tipo
 *         required: true
 *         schema:
 *           type: string
 *           enum: [cliente, parte_contraria, terceiro]
 *         description: Tipo de parte
 *       - in: path
 *         name: parte_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da parte
 *       - in: query
 *         name: trt
 *         schema:
 *           type: string
 *         description: Filtrar por TRT específico
 *       - in: query
 *         name: grau
 *         schema:
 *           type: string
 *           enum: ["1", "2"]
 *         description: Filtrar por grau específico
 *     responses:
 *       200:
 *         description: Lista de representantes da parte
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
 *                     $ref: '#/components/schemas/Representante'
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

    // Parse params
    const { parte_tipo, parte_id } = await context.params;
    const parteId = parseInt(parte_id);

    if (isNaN(parteId) || parteId <= 0) {
      return NextResponse.json(
        { success: false, error: 'ID da parte inválido' },
        { status: 400 }
      );
    }

    if (!['cliente', 'parte_contraria', 'terceiro'].includes(parte_tipo)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de parte inválido' },
        { status: 400 }
      );
    }

    // Parse query params
    const params: BuscarRepresentantesPorParteParams = {
      parte_tipo: parte_tipo as ParteTipo,
      parte_id: parteId,
    };

    // Find representantes
    const representantes = await buscarRepresentantesPorParte(params);

    return NextResponse.json({ success: true, data: representantes }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar representantes por parte:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar representantes' },
      { status: 500 }
    );
  }
}
