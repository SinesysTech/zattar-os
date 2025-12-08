/**
 * API de Centros de Custo
 * GET /api/centros-custo
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { createServiceClient } from '@/backend/utils/supabase/service-client';

export async function GET(request: NextRequest) {
  try {
    // Autenticar requisição
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Obter parâmetros de consulta
    const { searchParams } = new URL(request.url);
    const pagina = parseInt(searchParams.get('pagina') || '1', 10);
    const limite = parseInt(searchParams.get('limite') || '100', 10);
    const busca = searchParams.get('busca') || '';
    const ativo = searchParams.get('ativo') !== 'false';

    const supabase = createServiceClient();

    // Construir query
    let query = supabase
      .from('centros_custo')
      .select('id, codigo, nome, ativo', { count: 'exact' });

    // Filtrar por status ativo
    if (ativo) {
      query = query.eq('ativo', true);
    }

    // Filtrar por busca
    if (busca) {
      query = query.or(`codigo.ilike.%${busca}%,nome.ilike.%${busca}%`);
    }

    // Ordenar
    query = query.order('codigo', { ascending: true });

    // Paginação
    const inicio = (pagina - 1) * limite;
    query = query.range(inicio, inicio + limite - 1);

    const { data, count, error } = await query;

    if (error) {
      throw new Error(`Erro ao buscar centros de custo: ${error.message}`);
    }

    const total = count || 0;
    const totalPaginas = Math.ceil(total / limite);

    return NextResponse.json({
      success: true,
      data: {
        items: data || [],
        paginacao: {
          pagina,
          limite,
          total,
          totalPaginas,
        },
      },
    });
  } catch (error) {
    console.error('Erro na API de centros de custo:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    );
  }
}
