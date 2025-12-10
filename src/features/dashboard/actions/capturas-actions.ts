'use server';

/**
 * Server Actions para Status de Capturas
 * Substitui /api/dashboard/capturas/route.ts
 */

import { createClient } from '@/backend/utils/supabase/server';
import * as service from '../service';
import type { StatusCaptura } from '../types';

interface CapturasResult {
  capturas: StatusCaptura[];
  ultimaAtualizacao: string;
}

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Obtém status das últimas capturas por TRT (admin only)
 */
export async function actionObterCapturas(): Promise<ActionResult<CapturasResult>> {
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

    // Buscar status das capturas
    const data = await service.obterStatusCapturas();

    return { success: true, data };
  } catch (error) {
    console.error('Erro ao buscar status das capturas:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Obtém detalhes de uma captura específica (admin only)
 */
export async function actionObterDetalheCaptura(
  trt: string,
  grau: string
): Promise<ActionResult<StatusCaptura | null>> {
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

    // Buscar todas as capturas e filtrar
    const { capturas } = await service.obterStatusCapturas();
    const captura = capturas.find(c => c.trt === trt && c.grau === grau) || null;

    return { success: true, data: captura };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
