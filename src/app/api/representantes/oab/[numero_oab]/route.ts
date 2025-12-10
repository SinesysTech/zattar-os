/**
 * API Route: /api/representantes/oab/[numero_oab]
 * Query representantes by OAB number
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { buscarRepresentantesPorOAB } from '@/backend/representantes/services/representantes-persistence.service';
import type { BuscarRepresentantesPorOABParams } from '@/backend/types/representantes/representantes-types';

type RouteContext = {
  params: Promise<{
    numero_oab: string;
  }>;
};

/**
 * @swagger
 * /api/representantes/oab/{numero_oab}:
 *   get:
 *     summary: Busca todos os representantes com número OAB específico
 *     tags: [Representantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: numero_oab
 *         required: true
 *         schema:
 *           type: string
 *         description: Número da OAB (ex SP123456)
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
 *         description: Lista de representantes com o número OAB
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
 *         description: Número OAB não informado
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
    const { numero_oab } = await context.params;

    if (!numero_oab) {
      return NextResponse.json(
        { success: false, error: 'Número OAB não informado' },
        { status: 400 }
      );
    }

    // Parse query params - extract UF if present in numero_oab
    const uf = request.nextUrl.searchParams.get('uf') || undefined;
    const params: BuscarRepresentantesPorOABParams = {
      oab: numero_oab,
      uf,
    };

    // Find representantes
    const representantes = await buscarRepresentantesPorOAB(params);

    return NextResponse.json({ success: true, data: representantes }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar representantes por OAB:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar representantes' },
      { status: 500 }
    );
  }
}
