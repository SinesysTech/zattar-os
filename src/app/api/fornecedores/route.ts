import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateRequest } from '@/lib/auth/api-auth';

/**
 * GET /api/fornecedores
 * Lista fornecedores para uso em filtros e selects
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const ativo = searchParams.get('ativo');
    const limite = searchParams.get('limite');

    let query = supabase
      .from('fornecedores')
      .select('id, tipo_pessoa, nome, nome_social_fantasia, cpf, cnpj, ativo')
      .order('nome');

    // Filtrar por ativo
    if (ativo === 'true') {
      query = query.eq('ativo', true);
    }

    // Limitar resultados
    if (limite) {
      query = query.limit(parseInt(limite, 10));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao listar fornecedores:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar fornecedores' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        data: data || [],
      },
    });
  } catch (error) {
    console.error('Erro na API de fornecedores:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}
