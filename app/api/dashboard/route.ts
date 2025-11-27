/**
 * API Route: Dashboard
 *
 * GET /api/dashboard
 * Retorna dados da dashboard baseado no perfil do usuário autenticado
 *
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Obtém dados da dashboard personalizada
 *     description: Retorna dados agregados para a dashboard, diferenciados por perfil (usuário comum ou superadmin)
 *     tags:
 *       - Dashboard
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dados da dashboard
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/backend/auth/api-auth';
import { getDashboardUsuario } from '@/backend/dashboard/services/dashboard/dashboard-usuario.service';
import { getDashboardAdmin } from '@/backend/dashboard/services/dashboard/dashboard-admin.service';
import { withCache } from '@/backend/utils/redis';
import { DASHBOARD_CACHE_TTL } from '@/backend/types/dashboard/types';

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

    // Buscar dados do usuário para verificar is_super_admin
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

    const isSuperAdmin = usuario.is_super_admin === true;

    // Definir cache key baseado no perfil
    const cacheKey = isSuperAdmin
      ? 'dashboard:admin'
      : `dashboard:user:${usuarioId}`;

    const cacheTTL = isSuperAdmin
      ? DASHBOARD_CACHE_TTL.admin
      : DASHBOARD_CACHE_TTL.usuario;

    // Buscar dados com cache
    const data = await withCache(
      cacheKey,
      async () => {
        if (isSuperAdmin) {
          return await getDashboardAdmin();
        } else {
          return await getDashboardUsuario(usuarioId);
        }
      },
      cacheTTL
    );

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Erro ao buscar dados da dashboard:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
