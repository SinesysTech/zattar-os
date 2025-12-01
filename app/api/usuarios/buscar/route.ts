/**
 * API Route para busca simplificada de usuários
 *
 * GET /api/usuarios/buscar?q=termo - Busca usuários por nome ou email
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { createServiceClient } from '@/backend/utils/supabase/service-client';

/**
 * GET /api/usuarios/buscar
 * Busca usuários por nome ou email para compartilhamento
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.usuario) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (query.length < 2) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const supabase = createServiceClient();

    // Buscar usuários ativos que correspondam à busca
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nomeCompleto, nomeExibicao, emailCorporativo')
      .eq('ativo', true)
      .neq('id', authResult.usuario.id) // Excluir o próprio usuário
      .or(
        `nomeCompleto.ilike.%${query}%,nomeExibicao.ilike.%${query}%,emailCorporativo.ilike.%${query}%`
      )
      .order('nomeCompleto')
      .limit(10);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      },
      { status: 500 }
    );
  }
}
