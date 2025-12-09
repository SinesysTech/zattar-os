/**
 * Metrics Endpoint
 * 
 * Fornece estatísticas e métricas da API Meu Processo.
 * Requer autenticação via Service API Key.
 * 
 * @endpoint GET /api/meu-processo/metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getMetricsStats,
  getRequestHistory,
  resetMetrics,
  checkAlerts,
} from '@/lib/services/meu-processo-metrics';

// =============================================================================
// HANDLER
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const apiKey = request.headers.get('x-service-api-key');
    const expectedKey = process.env.SERVICE_API_KEY;

    if (!apiKey || !expectedKey || apiKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Autenticação inválida' },
        { status: 401 }
      );
    }

    // Query params
    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get('history') === 'true';
    const historyLimit = parseInt(searchParams.get('limit') || '100', 10);
    const checkAlertsFlag = searchParams.get('alerts') !== 'false'; // Default true

    // Obter estatísticas
    const stats = getMetricsStats();

    // Verificar alertas
    const alerts = checkAlertsFlag ? checkAlerts() : undefined;
    const activeAlerts = alerts?.filter(a => a.triggered) || [];

    // Response
    const response: {
      metrics: typeof stats;
      alerts: { total: number; items: Array<{ name: string; severity: string; message: string | undefined }> };
      history?: ReturnType<typeof getRequestHistory>;
    } = {
      metrics: stats,
      alerts: {
        total: activeAlerts.length,
        items: activeAlerts.map(a => ({
          name: a.condition.name,
          severity: a.condition.severity,
          message: a.message,
        })),
      },
    };

    // Incluir histórico se solicitado
    if (includeHistory) {
      response.history = getRequestHistory(historyLimit);
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error('[Métricas] Erro ao gerar estatísticas:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar métricas' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/meu-processo/metrics?action=reset
 * 
 * Reseta as métricas acumuladas
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const apiKey = request.headers.get('x-service-api-key');
    const expectedKey = process.env.SERVICE_API_KEY;

    if (!apiKey || !expectedKey || apiKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Autenticação inválida' },
        { status: 401 }
      );
    }

    // Query params
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'reset') {
      resetMetrics();
      return NextResponse.json({
        success: true,
        message: 'Métricas resetadas com sucesso',
      });
    }

    return NextResponse.json(
      { error: 'Ação inválida. Use ?action=reset' },
      { status: 400 }
    );

  } catch (error) {
    console.error('[Métricas] Erro ao processar ação:', error);
    return NextResponse.json(
      { error: 'Erro ao processar ação' },
      { status: 500 }
    );
  }
}
