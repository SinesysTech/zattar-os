/**
 * @swagger
 * /api/tribunais:
 *   get:
 *     summary: Lista todos os tribunais cadastrados
 *     description: Retorna a lista de tribunais disponíveis (TRT1-TRT24, TJs, TRFs, Tribunais Superiores)
 *     tags:
 *       - Tribunais
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista de tribunais retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     tribunais:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           codigo:
 *                             type: string
 *                             example: "TRT3"
 *                           nome:
 *                             type: string
 *                             example: "Tribunal Regional do Trabalho da 3ª Região"
 *                           regiao:
 *                             type: string
 *                             example: "Sudeste"
 *                           uf:
 *                             type: string
 *                             example: "MG"
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { createServiceClient } from '@/backend/utils/supabase/service-client';

export async function GET(request: NextRequest) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Buscar todos os tribunais
    const supabase = createServiceClient();

    const { data: tribunais, error } = await supabase
      .from('tribunais')
      .select('id, codigo, nome, regiao, uf')
      .order('codigo');

    if (error) {
      console.error('Erro ao buscar tribunais:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar tribunais' },
        { status: 500 }
      );
    }

    // 3. Retornar resultado
    return NextResponse.json({
      success: true,
      data: {
        tribunais: tribunais || [],
      },
    });
  } catch (error) {
    console.error('Erro ao buscar tribunais:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
