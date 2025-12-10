/**
 * API Route: Dashboard Capturas (Admin Only)
 *
 * GET /api/dashboard/capturas
 * Retorna status das últimas capturas por TRT para superadmins
 *
 * @swagger
 * /api/dashboard/capturas:
 *   get:
 *     summary: Obtém status das últimas capturas por TRT
 *     description: |
 *       Retorna o status das últimas capturas de dados do PJE-TRT incluindo:
 *       - Última execução por tribunal e grau
 *       - Status (sucesso, erro, pendente, executando)
 *       - Mensagem de erro (quando aplicável)
 *       - Contagem de processos, audiências e expedientes capturados
 *
 *       **Requer permissão de superadmin.**
 *     tags:
 *       - Dashboard
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Status das capturas
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
 *                     capturas:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/StatusCaptura'
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
import { getStatusCapturas } from '@/backend/dashboard/services/persistence/dashboard-metricas.persistence';
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

    // Buscar status das capturas com cache
    const cacheKey = DASHBOARD_CACHE_KEYS.capturas();
    const cacheTTL = DASHBOARD_CACHE_TTL.capturas;

    const data = await withCache(
      cacheKey,
      async () => {
        const capturas = await getStatusCapturas();

        return {
          capturas,
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
    console.error('Erro ao buscar status das capturas:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
