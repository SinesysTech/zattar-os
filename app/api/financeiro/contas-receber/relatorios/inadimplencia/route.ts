/**
 * API de Relatório de Inadimplência
 * GET /api/financeiro/contas-receber/relatorios/inadimplencia
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { buscarRelatorioInadimplencia } from '@/backend/financeiro/contas-receber/services/relatorios/inadimplencia.service';

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

    // Obter parâmetros de filtro
    const { searchParams } = new URL(request.url);
    const dataInicio = searchParams.get('dataInicio') || undefined;
    const dataFim = searchParams.get('dataFim') || undefined;

    // Buscar dados do relatório
    const relatorio = await buscarRelatorioInadimplencia({
      dataInicio,
      dataFim,
    });

    return NextResponse.json({
      success: true,
      data: relatorio,
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de inadimplência:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao gerar relatório',
      },
      { status: 500 }
    );
  }
}
