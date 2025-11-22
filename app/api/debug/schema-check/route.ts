/**
 * GET /api/debug/schema-check
 *
 * Verifica se a tabela acervo tem a coluna classe_judicial
 * e testa operações de INSERT/SELECT
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
          errorCode: (selectError as any)?.code,
          errorDetails: (selectError as any)?.details,
          errorHint: (selectError as any)?.hint,
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
