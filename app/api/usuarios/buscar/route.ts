/**
 * API Route para busca simplificada de usuários
 *
 * GET /api/usuarios/buscar?q=termo - Busca usuários por nome ou email
 * GET /api/usuarios/buscar?limit=100 - Lista todos os usuários ativos (para combobox)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { createServiceClient } from '@/backend/utils/supabase/service-client';

/**
 * GET /api/usuarios/buscar
 * Busca usuários por nome ou email para compartilhamento
 * Quando q está vazio mas limit é fornecido, retorna todos os usuários ativos
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.authenticated || !authResult.usuario) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    // Se não houver query e não houver limit explícito, retorna vazio
    if (query.length < 2 && !limitParam) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const supabase = createServiceClient();

    // Construir query base
    let queryBuilder = supabase
      .from('usuarios')
      .select('id, nomeCompleto, nomeExibicao, emailCorporativo')
      .eq('ativo', true)
      .neq('id', authResult.usuario.id); // Excluir o próprio usuário

    // Aplicar filtro de busca se houver query
    if (query.length >= 2) {
      queryBuilder = queryBuilder.or(
        `nomeCompleto.ilike.%${query}%,nomeExibicao.ilike.%${query}%,emailCorporativo.ilike.%${query}%`
      );
    }

    // Ordenar e limitar
    const { data, error } = await queryBuilder
      .order('nomeCompleto')
      .limit(limit);

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
