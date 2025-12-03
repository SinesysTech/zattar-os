/**
 * @swagger
 * /api/debug/schema-check:
 *   get:
 *     summary: Verifica schema do banco de dados
 *     description: Endpoint de debug para verificar se colunas existem no schema (apenas para desenvolvimento)
 *     tags:
 *       - Debug
 *     responses:
 *       200:
 *         description: Resultado da verificação de schema
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 results:
 *                   type: object
 *                   properties:
 *                     select:
 *                       type: object
 *                       properties:
 *                         success:
 *                           type: boolean
 *                         error:
 *                           type: string
 *                         data:
 *                           type: array
 *                 message:
 *                   type: string
 *       500:
 *         description: Erro interno
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/backend/utils/supabase/service-client';

export async function GET() {
  try {
    const supabase = createServiceClient();

    // 1. Tentar fazer SELECT na tabela acervo
    const { data: testSelect, error: selectError } = await supabase
      .from('acervo')
      .select('id, classe_judicial')
      .limit(1);

    console.log('📊 Test SELECT result:', { testSelect, selectError });

    return NextResponse.json({
      success: true,
      results: {
        select: {
          success: !selectError,
          error: selectError?.message,
          errorCode: selectError?.code,
          errorDetails: selectError?.details,
          errorHint: selectError?.hint,
          data: testSelect,
        },
      },
      message: selectError
        ? 'SELECT falhou - coluna classe_judicial pode não existir ou cache do PostgREST está desatualizado'
        : 'SELECT funcionou - coluna existe e está acessível',
    });
  } catch (error) {
    console.error('❌ Schema check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
