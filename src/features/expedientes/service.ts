/**
 * EXPEDIENTES SERVICE - Camada de Negócio
 */

import 'server-only';

import {
  createExpedienteSchema,
  updateExpedienteSchema,
  baixaExpedienteSchema,
  ListarExpedientesParams,
  Expediente,
} from './domain';
import * as repository from './repository';
import type { ExpedienteInsertInput, ExpedienteUpdateInput } from './repository';
import { Result, err, appError, PaginatedResponse } from '@/lib/types';
import { z } from 'zod';
import { createDbClient } from '@/lib/supabase';
import { appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';

type PlainObject = Record<string, unknown>;

// #region agent log helper
function logDebug(location: string, message: string, data: unknown, hypothesisId: string) {
  const logEntry = {
    location,
    message,
    data,
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'run1',
    hypothesisId,
  };

  // Try to write to file
  try {
    const logPath = join(process.cwd(), '.cursor', 'debug.log');
    try {
      mkdirSync(join(process.cwd(), '.cursor'), { recursive: true });
    } catch { }
    appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
  } catch {
    // Fallback: log to console with prefix for easy filtering
    console.log('[DEBUG]', JSON.stringify(logEntry));
  }
}
// #endregion

function camelToSnake<TInput extends PlainObject>(obj: TInput): PlainObject {
  const newObj: PlainObject = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      newObj[snakeKey] = obj[key];
    }
  }
  return newObj;
}


export async function criarExpediente(input: z.infer<typeof createExpedienteSchema>): Promise<Result<Expediente>> {
  const validation = createExpedienteSchema.safeParse(input);
  if (!validation.success) {
    return err(appError('VALIDATION_ERROR', 'Dados de entrada inválidos.', validation.error.flatten().fieldErrors));
  }
  const { processoId, tipoExpedienteId } = validation.data;

  if (processoId) {
    const processoExistsResult = await repository.processoExists(processoId);
    if (!processoExistsResult.success || !processoExistsResult.data) {
      return err(appError('NOT_FOUND', 'Processo não encontrado.'));
    }
  }

  if (tipoExpedienteId) {
    const tipoExistsResult = await repository.tipoExpedienteExists(tipoExpedienteId);
    if (!tipoExistsResult.success || !tipoExistsResult.data) {
      return err(appError('NOT_FOUND', 'Tipo de expediente não encontrado.'));
    }
  }

  const dataForRepo = camelToSnake(validation.data) as ExpedienteInsertInput;

  return repository.saveExpediente(dataForRepo);
}

export async function buscarExpediente(id: number): Promise<Result<Expediente | null>> {
  if (id <= 0) {
    return err(appError('VALIDATION_ERROR', 'ID do expediente inválido.'));
  }
  return repository.findExpedienteById(id);
}

export async function listarExpedientes(params: ListarExpedientesParams): Promise<Result<PaginatedResponse<Expediente>>> {
  const saneParams = {
    ...params,
    pagina: params.pagina && params.pagina > 0 ? params.pagina : 1,
    limite: params.limite && params.limite > 0 && params.limite <= 100 ? params.limite : 50,
    ordenarPor: params.ordenarPor ?? 'data_prazo_legal_parte',
    ordem: params.ordem ?? 'asc',
  };
  return repository.findAllExpedientes(saneParams);
}

export async function buscarExpedientesPorClienteCPF(cpf: string): Promise<Result<Expediente[]>> {
  if (!cpf || !cpf.trim()) {
    return err(appError('VALIDATION_ERROR', 'CPF é obrigatório.'));
  }
  return repository.findExpedientesByClienteCPF(cpf);
}

export async function atualizarExpediente(id: number, input: z.infer<typeof updateExpedienteSchema>): Promise<Result<Expediente>> {
  if (id <= 0) {
    return err(appError('VALIDATION_ERROR', 'ID do expediente inválido.'));
  }
  const validation = updateExpedienteSchema.safeParse(input);
  if (!validation.success) {
    return err(appError('VALIDATION_ERROR', 'Dados de entrada inválidos.', validation.error.flatten().fieldErrors));
  }

  const expedienteResult = await repository.findExpedienteById(id);
  if (!expedienteResult.success) return expedienteResult as Result<Expediente>;
  if (!expedienteResult.data) return err(appError('NOT_FOUND', 'Expediente não encontrado.'));

  const { processoId, tipoExpedienteId } = validation.data;
  if (processoId) {
    const processoExistsResult = await repository.processoExists(processoId);
    if (!processoExistsResult.success || !processoExistsResult.data) {
      return err(appError('NOT_FOUND', 'Processo não encontrado.'));
    }
  }
  if (tipoExpedienteId) {
    const tipoExistsResult = await repository.tipoExpedienteExists(tipoExpedienteId);
    if (!tipoExistsResult.success || !tipoExistsResult.data) {
      return err(appError('NOT_FOUND', 'Tipo de expediente não encontrado.'));
    }
  }

  const dataForRepo = camelToSnake(validation.data) as ExpedienteUpdateInput;


  return repository.updateExpediente(id, dataForRepo, expedienteResult.data);
}

export async function realizarBaixa(id: number, input: z.infer<typeof baixaExpedienteSchema>, userId: number): Promise<Result<Expediente>> {
  // #region agent log
  logDebug('service.ts:109', 'realizarBaixa ENTRY', { id, userId, hasInput: !!input }, 'A,B,C,D,E');
  // #endregion
  const validation = baixaExpedienteSchema.safeParse({ ...input, expedienteId: id });
  if (!validation.success) {
    // #region agent log
    logDebug('service.ts:114', 'VALIDATION_FAILED', { errors: validation.error.flatten().fieldErrors }, 'A');
    // #endregion
    return err(appError('VALIDATION_ERROR', 'Dados de entrada inválidos.', validation.error.flatten().fieldErrors));
  }

  const expedienteResult = await repository.findExpedienteById(id);
  // #region agent log
  logDebug('service.ts:122', 'findExpedienteById RESULT', { success: expedienteResult.success, hasData: expedienteResult.success && !!expedienteResult.data, baixadoEm: expedienteResult.success ? expedienteResult.data?.baixadoEm : undefined }, 'B');
  // #endregion
  if (!expedienteResult.success) return expedienteResult as Result<Expediente>;
  const expediente = expedienteResult.data;
  if (!expediente) return err(appError('NOT_FOUND', 'Expediente não encontrado.'));
  if (expediente.baixadoEm) return err(appError('BAD_REQUEST', 'Expediente já está baixado.'));

  const { protocoloId, justificativaBaixa, dataBaixa } = validation.data;
  // #region agent log
  logDebug('service.ts:130', 'BEFORE baixarExpediente', { id, protocoloId, hasJustificativa: !!justificativaBaixa, dataBaixa }, 'C');
  // #endregion
  const baixaResult = await repository.baixarExpediente(id, {
    protocoloId: protocoloId,
    justificativaBaixa: justificativaBaixa,
    baixadoEm: dataBaixa,
  });
  // #region agent log
  logDebug('service.ts:137', 'AFTER baixarExpediente', { success: baixaResult.success, hasData: baixaResult.success && !!baixaResult.data, error: baixaResult.success ? undefined : baixaResult.error }, 'C');
  // #endregion

  if (baixaResult.success) {
    // #region agent log
    logDebug('service.ts:140', 'BEFORE RPC call', { id, userId, protocoloId, hasJustificativa: !!justificativaBaixa }, 'D,E');
    // #endregion
    const db = createDbClient();
    const rpcParams = {
      p_expediente_id: id,
      p_usuario_id: userId,
      p_protocolo_id: protocoloId || null,
      p_justificativa: justificativaBaixa || null,
    };
    // #region agent log
    logDebug('service.ts:148', 'RPC PARAMS', rpcParams, 'E');
    // #endregion
    const rpcResult = await db.rpc('registrar_baixa_expediente', rpcParams);
    // #region agent log
    logDebug('service.ts:151', 'AFTER RPC call', { hasError: !!rpcResult.error, errorType: typeof rpcResult.error, errorValue: rpcResult.error, hasData: !!rpcResult.data }, 'A,D');
    // #endregion
    const { error: rpcError } = rpcResult;

    // Enhanced logging for debugging
    console.log('[DEBUG RPC RESULT]', {
      hasError: !!rpcError,
      error: rpcError,
      errorType: typeof rpcError,
      errorString: rpcError ? String(rpcError) : null,
      errorKeys: rpcError && typeof rpcError === 'object' ? Object.keys(rpcError) : null,
    });

    if (rpcError) {
      // #region agent log
      logDebug('service.ts:154', 'RPC ERROR DETECTED', { error: rpcError, errorString: String(rpcError), errorKeys: rpcError && typeof rpcError === 'object' ? Object.keys(rpcError) : null }, 'A');
      // #endregion
      // FIX: O log de auditoria falhou, mas a baixa já foi feita.
      // Por questões de auditoria, isso é crítico. Vamos logar o erro mas não falhar a operação,
      // pois reverter a baixa pode causar inconsistências. O erro será registrado no console do servidor.
      // TODO: Considerar implementar um mecanismo de retry ou fila para logs de auditoria falhos.
      console.error('[CRITICAL] Falha ao registrar log de auditoria de baixa de expediente:', {
        expedienteId: id,
        userId: userId,
        rpcError: rpcError,
        baixaFoiRealizada: true, // Importante: a baixa JÁ foi feita no banco
      });

      // NOTA: Não revertemos a baixa porque:
      // 1. A operação principal (baixa) foi bem-sucedida
      // 2. Reverter pode causar inconsistências se outras operações dependerem dessa baixa
      // 3. O erro está sendo logado para investigação posterior
      // A operação retorna sucesso, mas o log de auditoria falhou.
    } else {
      // #region agent log
      logDebug('service.ts:158', 'RPC SUCCESS', {}, 'A');
      // #endregion
      console.log('[DEBUG RPC] Sucesso ao registrar log de baixa');
    }
  } else {
    // #region agent log
    logDebug('service.ts:161', 'baixaResult FAILED', { error: baixaResult.error }, 'B');
    // #endregion
  }

  // #region agent log
  logDebug('service.ts:164', 'realizarBaixa EXIT', { success: baixaResult.success }, 'A,B');
  // #endregion
  return baixaResult;
}

export async function reverterBaixa(id: number, userId: number): Promise<Result<Expediente>> {
  if (id <= 0) {
    return err(appError('VALIDATION_ERROR', 'ID do expediente inválido.'));
  }

  const expedienteResult = await repository.findExpedienteById(id);
  if (!expedienteResult.success) return expedienteResult as Result<Expediente>;
  const expediente = expedienteResult.data;
  if (!expediente) return err(appError('NOT_FOUND', 'Expediente não encontrado.'));
  if (!expediente.baixadoEm) return err(appError('BAD_REQUEST', 'Expediente não está baixado.'));

  const { protocoloId, justificativaBaixa } = expediente;

  const reversaoResult = await repository.reverterBaixaExpediente(id);

  if (reversaoResult.success) {
    const db = createDbClient();
    const { error: rpcError } = await db.rpc('registrar_reversao_baixa_expediente', {
      p_expediente_id: id,
      p_usuario_id: userId,
      p_protocolo_id_anterior: protocoloId,
      p_justificativa_anterior: justificativaBaixa,
    });
    if (rpcError) {
      console.error('Falha ao registrar log de reversão de baixa:', rpcError);
    }
  }

  return reversaoResult;
}

export async function atribuirResponsavel(
  expedienteId: number,
  responsavelId: number | null,
  usuarioExecutouId?: number // Optional param if coming from frontend context
): Promise<Result<boolean>> {
  try {
    const db = createDbClient();
    let userId = usuarioExecutouId;
    if (!userId) {
      const { data: { session } } = await db.auth.getSession();
      if (session?.user?.id) {
        const { data: userData } = await db.from('usuarios').select('id').eq('auth_user_id', session.user.id).single();
        userId = userData?.id;
      }
    }

    if (!userId) return err(appError('UNAUTHORIZED', 'Usuário não autenticado.'));

    const { error } = await db.rpc('atribuir_responsavel_pendente', {
      p_pendente_id: expedienteId,
      p_responsavel_id: responsavelId,
      p_usuario_executou_id: userId
    });

    if (error) {
      return err(appError('DATABASE_ERROR', error.message));
    }

    return { success: true, data: true };

  } catch (error) {
    return err(appError('DATABASE_ERROR', 'Erro ao atribuir responsável.', undefined, error instanceof Error ? error : undefined));
  }
}

export async function atualizarTipoDescricao(
  expedienteId: number,
  tipoExpedienteId: number | null,
  descricaoArquivos?: string | null,
  usuarioExecutouId?: number
): Promise<Result<Expediente>> {
  const db = createDbClient();
  let userId = usuarioExecutouId;
  if (!userId) {
    const { data: { session } } = await db.auth.getSession();
    if (session?.user?.id) {
      const { data: userData } = await db.from('usuarios').select('id').eq('auth_user_id', session.user.id).single();
      userId = userData?.id;
    }
  }
  if (!userId) return err(appError('UNAUTHORIZED', 'Usuário não autenticado.'));

  const currentResult = await repository.findExpedienteById(expedienteId);
  if (!currentResult.success || !currentResult.data) return err(appError('NOT_FOUND', 'Expediente não encontrado.'));
  const current = currentResult.data;

  const repoUpdateInput = {
    tipo_expediente_id: tipoExpedienteId,
    descricao_arquivos: descricaoArquivos,
    updated_at: new Date().toISOString()
  };

  const updateResult = await repository.updateExpediente(expedienteId, repoUpdateInput, current);
  if (!updateResult.success) return updateResult;

  await db.from('logs_alteracao').insert({
    tipo_entidade: 'expedientes',
    entidade_id: expedienteId,
    tipo_evento: 'alteracao_tipo_descricao',
    usuario_que_executou_id: userId,
    dados_evento: {
      tipo_expediente_id_anterior: current.tipoExpedienteId,
      tipo_expediente_id_novo: tipoExpedienteId,
      descricao_arquivos_anterior: current.descricaoArquivos,
      descricao_arquivos_novo: descricaoArquivos,
      alterado_em: new Date().toISOString(),
    },
  });

  return {
    success: true,
    data: updateResult.data,
  };
}
