// Rota de API para listar credenciais de captura
// GET: Listar credenciais ativas com informações dos advogados

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { createServiceClient } from '@/backend/utils/supabase/service-client';

/**
 * @swagger
 * /api/captura/credenciais:
 *   get:
 *     summary: Lista credenciais para captura
 *     description: Retorna uma lista de credenciais com informações dos advogados, tribunais e graus disponíveis. Por padrão retorna todas as credenciais, mas pode ser filtrado por active=true ou active=false
 *     tags:
 *       - Captura TRT
 *     security:
 *       - bearerAuth: []
 *       - sessionAuth: []
 *       - serviceApiKey: []
 *     responses:
 *       200:
 *         description: Lista de credenciais retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     credenciais:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           advogado_id:
 *                             type: integer
 *                           advogado_nome:
 *                             type: string
 *                           advogado_cpf:
 *                             type: string
 *                           advogado_oab:
 *                             type: string
 *                           advogado_uf_oab:
 *                             type: string
 *                           tribunal:
 *                             type: string
 *                           grau:
 *                             type: string
 *                     tribunais_disponiveis:
 *                       type: array
 *                       items:
 *                         type: string
 *                     graus_disponiveis:
 *                       type: array
 *                       items:
 *                         type: string
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno do servidor
 */
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

    // 2. Buscar credenciais com informações dos advogados
    const supabase = createServiceClient();
    
    // Verificar se há filtro de active na query string
    const { searchParams } = new URL(request.url);
    const activeFilter = searchParams.get('active');
    
    let query = supabase
      .from('credenciais')
      .select(`
        id,
        advogado_id,
        tribunal,
        grau,
        active,
        created_at,
        updated_at,
        advogados (
          id,
          nome_completo,
          cpf,
          oab,
          uf_oab
        )
      `);
    
    // Aplicar filtro de active se fornecido
    if (activeFilter !== null) {
      query = query.eq('active', activeFilter === 'true');
    }
    
    const { data: credenciais, error } = await query
      .order('advogado_id')
      .order('tribunal')
      .order('grau');

    if (error) {
      console.error('Erro ao buscar credenciais:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar credenciais' },
        { status: 500 }
      );
    }

    // 3. Processar dados
    const credenciaisProcessadas = (credenciais || []).map((credencial) => {
      const advogadoRaw = credencial.advogados;
      const advogado = Array.isArray(advogadoRaw)
        ? advogadoRaw[0]
        : advogadoRaw;

      return {
        id: credencial.id,
        advogado_id: credencial.advogado_id,
        advogado_nome: advogado?.nome_completo || '',
        advogado_cpf: advogado?.cpf || '',
        advogado_oab: advogado?.oab || '',
        advogado_uf_oab: advogado?.uf_oab || '',
        tribunal: credencial.tribunal,
        grau: credencial.grau,
        active: credencial.active ?? true,
        created_at: credencial.created_at || new Date().toISOString(),
        updated_at: credencial.updated_at,
      };
    });

    // 4. Extrair tribunais e graus únicos disponíveis
    const tribunaisDisponiveis = Array.from(
      new Set(credenciaisProcessadas.map((c) => c.tribunal))
    ).sort();

    const grausDisponiveis = Array.from(
      new Set(credenciaisProcessadas.map((c) => c.grau))
    ).sort();

    // 5. Retornar resultado
    return NextResponse.json({
      success: true,
      data: {
        credenciais: credenciaisProcessadas,
        tribunais_disponiveis: tribunaisDisponiveis,
        graus_disponiveis: grausDisponiveis,
      },
    });
  } catch (error) {
    console.error('Error in credenciais GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


