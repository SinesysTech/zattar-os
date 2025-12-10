'use server';

import { requireAuth } from './utils';
import * as service from '../comunica-cnj/service';
import type {
  ConsultarComunicacoesParams,
  SincronizarParams,
  ListarComunicacoesParams,
} from '../comunica-cnj/domain';
import { SincronizacaoResult, ConsultaResult, ComunicacaoCNJ } from '../comunica-cnj/domain';
import { PaginatedResponse } from '@/core/common/types';

// =============================================================================
// ACTIONS
// =============================================================================

/**
 * Consulta comunicações na API do CNJ (sem persistir)
 */
export async function actionConsultarComunicacoes(params: ConsultarComunicacoesParams): Promise<{ success: boolean; data?: ConsultaResult; error?: string }> {
  try {
    await requireAuth(['comunica_cnj:consultar']); 
    
    const result = await service.buscarComunicacoes(params);
    if (!result.success) {
      return { success: false, error: result.error.message };
    }
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao consultar comunicações' };
  }
}

/**
 * Lista comunicações capturadas (do banco de dados)
 */
export async function actionListarComunicacoesCapturadas(params: ListarComunicacoesParams): Promise<{ success: boolean; data?: PaginatedResponse<ComunicacaoCNJ>; error?: string }> {
  try {
    await requireAuth(['comunica_cnj:listar']);

    const result = await service.listarComunicacoesCapturadas(params);
    if (!result.success) {
      return { success: false, error: result.error.message };
    }
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao listar comunicações' };
  }
}

/**
 * Sincroniza comunicações (captura e persiste)
 */
export async function actionSincronizarComunicacoes(params: SincronizarParams): Promise<{ success: boolean; data?: SincronizacaoResult; error?: string }> {
  try {
    await requireAuth(['comunica_cnj:capturar']);

    const result = await service.sincronizarComunicacoes(params);
    if (!result.success) {
      // service.sincronizarComunicacoes retorna success:false no objeto mas também Result<T> wrapper?
      // service.sincronizarComunicacoes returns Result<SincronizacaoResult>. 
      return { success: false, error: result.error.message };
    }
    // Result.data is SincronizacaoResult which also has success/stats
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao sincronizar comunicações' };
  }
}

/**
 * Obtém certidão em PDF (base64)
 */
export async function actionObterCertidao(hash: string): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    await requireAuth(['comunica_cnj:visualizar']);

    const result = await service.obterCertidao(hash);
    if (!result.success) {
      return { success: false, error: result.error.message };
    }
    
    // Convert buffer to base64
    const base64 = result.data.toString('base64');
    return { success: true, data: base64 };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao obter certidão' };
  }
}

/**
 * Vincula comunicação a expediente
 */
export async function actionVincularExpediente(comunicacaoId: number, expedienteId: number): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth(['comunica_cnj:editar', 'expedientes:editar']);

    const result = await service.vincularComunicacaoAExpediente(comunicacaoId, expedienteId);
    if (!result.success) {
      return { success: false, error: result.error.message };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao vincular expediente' };
  }
}

/**
 * Listar tribunais disponíveis
 */
export async function actionListarTribunaisDisponiveis(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    // Permissão genérica ou pública autenticada
    await requireAuth([]); 

    const result = await service.listarTribunaisDisponiveis();
    if (!result.success) {
      return { success: false, error: result.error.message };
    }
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao listar tribunais' };
  }
}
