import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/backend/utils/supabase/server-client';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';

/**
 * GET /api/audiencias/tipos
 * Lista tipos de audiência disponíveis
 *
 * Query params:
 * - trt: Código do TRT (obrigatório)
 * - grau: Grau do tribunal (obrigatório)
 *
 * @returns Lista de tipos de audiência com id, descricao e is_virtual
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Obter parâmetros da query
    const searchParams = request.nextUrl.searchParams;
    const trt = searchParams.get('trt');
    const grau = searchParams.get('grau');

    // 3. Validar parâmetros obrigatórios
    if (!trt) {
      return NextResponse.json(
        { error: 'Parâmetro trt é obrigatório' },
        { status: 400 }
      );
    }

    if (!grau) {
      return NextResponse.json(
        { error: 'Parâmetro grau é obrigatório' },
        { status: 400 }
      );
    }

    if (grau !== 'primeiro_grau' && grau !== 'segundo_grau') {
      return NextResponse.json(
        { error: 'Parâmetro grau deve ser primeiro_grau ou segundo_grau' },
        { status: 400 }
      );
    }

    // 4. Buscar tipos de audiência
    const supabase = await createClient();
    const { data: tipos, error } = await supabase
      .from('tipo_audiencia')
      .select('id, descricao, is_virtual')
      .eq('trt', trt)
      .eq('grau', grau)
      .order('descricao', { ascending: true });

    if (error) {
      console.error('Erro ao buscar tipos de audiência:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar tipos de audiência' },
        { status: 500 }
      );
    }

    // 5. Retornar resultado
    return NextResponse.json({
      success: true,
      data: tipos || [],
    });
  } catch (error) {
    console.error('Erro ao buscar tipos de audiência:', error);
    const erroMsg = error instanceof Error ? error.message : 'Erro ao buscar tipos de audiência';
    return NextResponse.json({ error: erroMsg }, { status: 500 });
  }
}
