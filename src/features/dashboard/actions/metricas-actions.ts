'use server';

/**
 * Server Actions para Métricas Admin
 * Substitui /api/dashboard/metricas/route.ts
 */

import { createClient } from '@/lib/supabase/server';
import * as service from '../service';
import type { MetricasEscritorio, CargaUsuario, PerformanceAdvogado } from '../types';

interface MetricasResult {
  metricas: MetricasEscritorio;
  cargaUsuarios: CargaUsuario[];
  performanceAdvogados: PerformanceAdvogado[];
  ultimaAtualizacao: string;
}

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Obtém métricas globais do escritório (admin only)
 */
export async function actionObterMetricas(): Promise<ActionResult<MetricasResult>> {
  try {
    const supabase = await createClient();

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Não autenticado' };
    }

    // Verificar se é superadmin
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id, is_super_admin')
      .eq('auth_id', user.id)
      .single();

    if (!usuario) {
      return { success: false, error: 'Usuário não encontrado' };
    }

    if (usuario.is_super_admin !== true) {
      return { success: false, error: 'Acesso restrito a administradores' };
    }

    // Buscar métricas
    const data = await service.obterMetricasEscritorio();

    return { success: true, data };
  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Obtém carga de trabalho por usuário (admin only)
 */
export async function actionObterCargaUsuarios(): Promise<ActionResult<CargaUsuario[]>> {
  try {
    const supabase = await createClient();

    // Verificar autenticação e permissão
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Não autenticado' };

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('is_super_admin')
      .eq('auth_id', user.id)
      .single();

    if (!usuario?.is_super_admin) {
      return { success: false, error: 'Acesso restrito a administradores' };
    }

    const { cargaUsuarios } = await service.obterMetricasEscritorio();

    return { success: true, data: cargaUsuarios };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Obtém performance dos advogados (admin only)
 */
export async function actionObterPerformanceAdvogados(): Promise<ActionResult<PerformanceAdvogado[]>> {
  try {
    const supabase = await createClient();

    // Verificar autenticação e permissão
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Não autenticado' };

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('is_super_admin')
      .eq('auth_id', user.id)
      .single();

    if (!usuario?.is_super_admin) {
      return { success: false, error: 'Acesso restrito a administradores' };
    }

    const { performanceAdvogados } = await service.obterMetricasEscritorio();

    return { success: true, data: performanceAdvogados };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
