/**
 * API Route: /api/representantes/processo
 * Query representantes by process number
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
import { buscarRepresentantesPorProcesso } from '@/backend/representantes/services/representantes-persistence.service';
import type { BuscarRepresentantesPorProcessoParams, Grau } from '@/backend/types/representantes/representantes-types';

/**
 * @swagger
 * /api/representantes/processo:
 *   get:
 *     summary: Busca todos os representantes de um processo específico
 *     tags: [Representantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: numero_processo
 *         required: true
 *         schema:
 *           type: string
 *         description: Número do processo
 *       - in: query
 *         name: trt
 *         required: true
 *         schema:
 *           type: string
 *         description: Tribunal Regional do Trabalho
 *       - in: query
 *         name: grau
 *         required: true
 *         schema:
 *           type: string
 *           enum: ["1", "2"]
 *         description: Grau do processo
 *     responses:
 *       200:
 *         description: Lista de representantes do processo
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
 *         description: Parâmetros obrigatórios não informados ou inválidos
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

    // Parse query params (all required)
    const searchParams = request.nextUrl.searchParams;
    const numero_processo = searchParams.get('numero_processo');
    const trt = searchParams.get('trt');
    const grau = searchParams.get('grau');

    if (!numero_processo || !trt || !grau) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros obrigatórios: numero_processo, trt, grau' },
        { status: 400 }
      );
    }

    if (!['1', '2'].includes(grau)) {
      return NextResponse.json(
        { success: false, error: 'Grau inválido (deve ser "1" ou "2")' },
        { status: 400 }
      );
    }

    const params: BuscarRepresentantesPorProcessoParams = {
      numero_processo,
      trt,
      grau: grau as Grau,
    };

    // Find representantes
    const representantes = await buscarRepresentantesPorProcesso(params);

    return NextResponse.json({ success: true, data: representantes }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar representantes por processo:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar representantes' },
      { status: 500 }
    );
  }
}
