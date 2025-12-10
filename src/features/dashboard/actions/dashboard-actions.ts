'use server';

/**
 * Server Actions para Dashboard Principal
 * Substitui /api/dashboard/route.ts
 */

import { createClient } from '@/backend/utils/supabase/server';
import * as service from '../service';
import type { DashboardData } from '../types';

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Obtém dados da dashboard baseado no perfil do usuário autenticado
 */
export async function actionObterDashboard(): Promise<ActionResult<DashboardData>> {
  try {
    const supabase = await createClient();

    // Obter usuário autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' };
    }

    // Buscar dados do usuário
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('id, is_super_admin')
      .eq('auth_id', user.id)
      .single();

    if (usuarioError || !usuario) {
      return { success: false, error: 'Usuário não encontrado' };
    }

    // Buscar dados baseado no perfil
    const data = usuario.is_super_admin === true
      ? await service.obterDashboardAdmin()
      : await service.obterDashboardUsuario(usuario.id);

    return { success: true, data };
  } catch (error) {
    console.error('Erro ao buscar dashboard:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Obtém dados da dashboard para um usuário específico (admin only)
 */
export async function actionObterDashboardUsuario(
  usuarioId: number
): Promise<ActionResult<DashboardData>> {
  try {
    const supabase = await createClient();

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' };
    }

    // Verificar se é admin ou o próprio usuário
    const { data: usuarioLogado } = await supabase
      .from('usuarios')
      .select('id, is_super_admin')
      .eq('auth_id', user.id)
      .single();

    if (!usuarioLogado) {
      return { success: false, error: 'Usuário não encontrado' };
    }

    // Apenas admin pode ver dashboard de outros usuários
    if (!usuarioLogado.is_super_admin && usuarioLogado.id !== usuarioId) {
      return { success: false, error: 'Acesso negado' };
    }

    const data = await service.obterDashboardUsuario(usuarioId);

    return { success: true, data };
  } catch (error) {
    console.error('Erro ao buscar dashboard do usuário:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Força atualização da dashboard (invalida cache)
 */
export async function actionRefreshDashboard(): Promise<ActionResult<DashboardData>> {
  // Por enquanto, apenas re-busca os dados
  // Futuramente pode invalidar cache Redis
  return actionObterDashboard();
}
