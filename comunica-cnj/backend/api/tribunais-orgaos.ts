/**
 * API Endpoint: Listar Órgãos de um Tribunal
 *
 * GET /api/tribunais/[sigla]/orgaos
 *
 * Retorna lista de órgãos judiciais para um tribunal específico.
 * Usado pela interface do Comunica CNJ para preencher o select de órgãos.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

/**
 * GET /api/tribunais/[sigla]/orgaos
 *
 * Retorna órgãos ativos de um tribunal, ordenados alfabeticamente
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sigla: string }> }
) {
  try {
    const { sigla } = await context.params;

    // Validar parâmetro
    if (!sigla || typeof sigla !== 'string') {
      return NextResponse.json(
        { error: 'Parâmetro "sigla" inválido' },
        { status: 400 }
      );
    }

    // Buscar tribunal
    const supabase = await getSupabase();
    const { data: tribunal, error: tribunalError } = await supabase
      .from('Tribunal')
      .select('id, codigo, nome')
      .eq('codigo', sigla.toUpperCase())
      .single();

    if (tribunalError?.code === 'PGRST116' || !tribunal) {
      return NextResponse.json(
        {
          error: 'Tribunal não encontrado',
          sigla: sigla.toUpperCase(),
        },
        { status: 404 }
      );
    }

    // Buscar órgãos ativos do tribunal
    const { data: orgaos, error: orgaosError } = await supabase
      .from('TribunalOrgao')
      .select('id, orgaoIdCNJ, nome, tipo')
      .eq('tribunalId', tribunal.id)
      .eq('ativo', true)
      .order('nome', { ascending: true });

    if (orgaosError) {
      throw new Error(`Error fetching orgaos: ${orgaosError.message}`);
    }

    // Retornar resposta
    return NextResponse.json({
      tribunal: {
        codigo: tribunal.codigo,
        nome: tribunal.nome,
      },
      total: orgaos.length,
      orgaos: orgaos,
    });
  } catch (error) {
    console.error('Erro ao buscar órgãos:', error);

    return NextResponse.json(
      {
        error: 'Erro interno ao buscar órgãos',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

