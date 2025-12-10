/**
 * API Route: /api/representantes/processo
 * Query representantes by process number
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
// TODO: Refactor to query via processo_partes JOIN
// import { buscarRepresentantesPorProcesso } from '@/backend/representantes/services/representantes-persistence.service';
// import type { BuscarRepresentantesPorProcessoParams, Grau } from '@/backend/types/representantes/representantes-types';

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

    // TODO: Refactor to query representantes via JOIN with processo_partes
    // Since representantes no longer has trt/grau/numero_processo columns,
    // need to query: processo_partes -> get parte_id/parte_tipo -> representantes
    return NextResponse.json(
      { success: false, error: 'Endpoint temporariamente desabilitado - necessita refatoração' },
      { status: 501 }
    );
  } catch (error) {
    console.error('Erro ao buscar representantes por processo:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar representantes' },
      { status: 500 }
    );
  }
}
