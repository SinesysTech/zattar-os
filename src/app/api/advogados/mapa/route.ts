import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { createServiceClient } from '@/lib/supabase/service-client';

/**
 * GET /api/advogados/mapa
 * Retorna dados mínimos de advogados para lookup (id, nome_completo).
 * Query leve sem paginação — para uso em mapas de referência.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('advogados')
      .select('id, nome_completo')
      .order('nome_completo');

    if (error) {
      throw new Error(`Erro ao listar advogados: ${error.message}`);
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Erro ao buscar advogados mapa:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar advogados para mapeamento' },
      { status: 500 }
    );
  }
}
