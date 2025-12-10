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

    // Construir query base (colunas são snake_case no banco)
    let queryBuilder = supabase
      .from('usuarios')
      .select('id, nome_completo, nome_exibicao, email_corporativo')
      .eq('ativo', true)
      .neq('id', authResult.usuario.id); // Excluir o próprio usuário

    // Aplicar filtro de busca se houver query
    if (query.length >= 2) {
      queryBuilder = queryBuilder.or(
        `nome_completo.ilike.%${query}%,nome_exibicao.ilike.%${query}%,email_corporativo.ilike.%${query}%`
      );
    }

    // Ordenar e limitar
    const { data, error } = await queryBuilder
      .order('nome_completo')
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    // Mapear para camelCase para o frontend
    const mappedData = (data || []).map((u) => ({
      id: u.id,
      nomeCompleto: u.nome_completo,
      nomeExibicao: u.nome_exibicao,
      emailCorporativo: u.email_corporativo,
    }));

    return NextResponse.json({
      success: true,
      data: mappedData,
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
