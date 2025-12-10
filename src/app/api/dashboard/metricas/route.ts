/**
 * API Route: Dashboard Métricas (Admin Only)
 *
 * GET /api/dashboard/metricas
 * Retorna métricas globais do escritório para superadmins
 *
 * @swagger
 * /api/dashboard/metricas:
 *   get:
 *     summary: Obtém métricas globais do escritório
 *     description: |
 *       Retorna métricas consolidadas do escritório incluindo:
 *       - Total de processos (ativos, arquivados, únicos)
 *       - Audiências do mês e total
 *       - Expedientes pendentes e vencidos
 *       - Taxa de resolução no prazo
 *       - Comparativos com mês anterior
 *
 *       **Requer permissão de superadmin.**
 *     tags:
 *       - Dashboard
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Métricas do escritório
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     metricas:
 *                       $ref: '#/components/schemas/MetricasEscritorio'
 *                     cargaUsuarios:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CargaUsuario'
 *                     performanceAdvogados:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PerformanceAdvogado'
 *                     ultimaAtualizacao:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão (requer superadmin)
 *       500:
 *         description: Erro interno
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import {
  getMetricasEscritorio,
  getCargaUsuarios,
  getPerformanceAdvogados,
} from '@/backend/dashboard/services/persistence/dashboard-metricas.persistence';
import { withCache } from '@/backend/utils/redis';
import { DASHBOARD_CACHE_KEYS, DASHBOARD_CACHE_TTL } from '@/backend/types/dashboard/types';

export async function GET(request: NextRequest) {
  try {
    // Autenticar usuário
    const authResult = await authenticateRequest(request);

    if (!authResult.authenticated || !authResult.usuarioId) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const usuarioId = authResult.usuarioId;

    // Verificar se é superadmin
    const { createServiceClient } = await import('@/backend/utils/supabase/service-client');
    const supabase = createServiceClient();

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id, is_super_admin')
      .eq('id', usuarioId)
      .single();

    if (!usuario) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    if (usuario.is_super_admin !== true) {
      return NextResponse.json(
        { success: false, error: 'Acesso restrito a superadmins' },
        { status: 403 }
      );
    }

    // Buscar métricas com cache
    const cacheKey = DASHBOARD_CACHE_KEYS.metricas();
    const cacheTTL = DASHBOARD_CACHE_TTL.metricas;

    const data = await withCache(
      cacheKey,
      async () => {
        // Buscar dados em paralelo
        const [metricas, cargaUsuarios, performanceAdvogados] = await Promise.all([
          getMetricasEscritorio(),
          getCargaUsuarios(),
          getPerformanceAdvogados(),
        ]);

        return {
          metricas,
          cargaUsuarios,
          performanceAdvogados,
          ultimaAtualizacao: new Date().toISOString(),
        };
      },
      cacheTTL
    );

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Erro ao buscar métricas do escritório:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
