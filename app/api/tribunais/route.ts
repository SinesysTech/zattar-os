/**
 * API route para listar tribunais cadastrados (base table)
 * GET: Lista todos os tribunais (TRT1-TRT24, TJs, TRFs, Tribunais Superiores)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/utils/auth/api-auth';
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
      .select('id, codigo, nome, tipo')
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
