// Serviço auxiliar para gerenciar histórico de capturas
// Facilita o registro e atualização de capturas no histórico

import {
  criarCapturaLog,
  atualizarCapturaLog,
} from './persistence/captura-log-persistence.service';
import type {
  StatusCaptura,
  CriarCapturaLogParams,
} from '../types';

/**
 * Criar registro de captura e retornar ID
 */
export async function iniciarCapturaLog(
  params: CriarCapturaLogParams
): Promise<number> {
  const log = await criarCapturaLog({
    ...params,
    status: params.status || 'in_progress',
  });
  return log.id;
}

/**
 * Atualizar registro de captura com resultado de sucesso
 */
export async function finalizarCapturaLogSucesso(
  logId: number,
  resultado: Record<string, unknown>
): Promise<void> {
  await atualizarCapturaLog(logId, {
    status: 'completed',
    resultado,
    concluido_em: new Date().toISOString(),
  });
}

/**
 * Atualizar registro de captura com erro
 */
export async function finalizarCapturaLogErro(
  logId: number,
  erro: string
): Promise<void> {
  await atualizarCapturaLog(logId, {
    status: 'failed',
    erro,
    concluido_em: new Date().toISOString(),
  });
}

/**
 * Atualizar status de captura
 */
export async function atualizarStatusCapturaLog(
  logId: number,
  status: StatusCaptura
): Promise<void> {
  await atualizarCapturaLog(logId, {
    status,
  });
}

