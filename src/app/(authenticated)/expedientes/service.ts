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
import { Result, err, appError, PaginatedResponse } from '@/types';
import { z } from 'zod';
import { createDbClient } from '@/lib/supabase';

type PlainObject = Record<string, unknown>;

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
  // FK constraints do Postgres validam processoId e tipoExpedienteId —
  // queries de pré-validação removidas para eliminar N+1.
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
    limite: params.limite && params.limite > 0 && params.limite <= 1000 ? params.limite : 50,
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

  // Busca necessária para dados_anteriores (auditoria)
  const expedienteResult = await repository.findExpedienteById(id);
  if (!expedienteResult.success) return expedienteResult as Result<Expediente>;
  if (!expedienteResult.data) return err(appError('NOT_FOUND', 'Expediente não encontrado.'));

  // FK constraints do Postgres validam processoId e tipoExpedienteId —
  // queries de pré-validação removidas para eliminar N+1.
  const dataForRepo = camelToSnake(validation.data) as ExpedienteUpdateInput;

  return repository.updateExpediente(id, dataForRepo, expedienteResult.data);
}

export async function realizarBaixa(id: number, input: z.infer<typeof baixaExpedienteSchema>, userId: number): Promise<Result<Expediente>> {
  const validation = baixaExpedienteSchema.safeParse({ ...input, expedienteId: id });
  if (!validation.success) {
    return err(appError('VALIDATION_ERROR', 'Dados de entrada inválidos.', validation.error.flatten().fieldErrors));
  }

  const expedienteResult = await repository.findExpedienteById(id);
  if (!expedienteResult.success) return expedienteResult as Result<Expediente>;
  const expediente = expedienteResult.data;
  if (!expediente) return err(appError('NOT_FOUND', 'Expediente não encontrado.'));
  if (expediente.baixadoEm) return err(appError('BAD_REQUEST', 'Expediente já está baixado.'));

  const { protocoloId, justificativaBaixa, dataBaixa, resultadoDecisao } = validation.data;

  // RPC atômica: UPDATE + log numa única transação. Auditoria não pode mais
  // divergir silenciosamente do estado da tabela — ambos são commitados
  // juntos ou nenhum é.
  return repository.baixarExpediente(
    id,
    {
      protocoloId: protocoloId,
      justificativaBaixa: justificativaBaixa,
      baixadoEm: dataBaixa,
      resultadoDecisao: resultadoDecisao,
    },
    userId
  );
}

export async function reverterBaixa(id: number, userId: number): Promise<Result<Expediente>> {
  if (id <= 0) {
    return err(appError('VALIDATION_ERROR', 'ID do expediente inválido.'));
  }

  // RPC atômica: UPDATE + log numa única transação. A validação "expediente
  // está baixado?" é feita dentro da RPC (WHERE baixado_em IS NOT NULL),
  // dispensando a consulta prévia que antes ficava fora da transação.
  return repository.reverterBaixaExpediente(id, userId);
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
      const { data: { user }, error: authError } = await db.auth.getUser();
      if (!authError && user?.id) {
        const { data: userData } = await db.from('usuarios').select('id').eq('auth_user_id', user.id).single();
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

/**
 * Atribui um único responsável a múltiplos expedientes numa única transação
 * Postgres. All-or-nothing: se algum id não existir, a RPC lança exceção e
 * nenhuma alteração é persistida.
 */
export async function bulkAtribuirResponsavel(
  expedienteIds: number[],
  responsavelId: number | null,
  usuarioExecutouId: number
): Promise<Result<{ atualizados: number; total: number }>> {
  if (expedienteIds.length === 0) {
    return err(appError('VALIDATION_ERROR', 'Selecione pelo menos um expediente.'));
  }
  if (usuarioExecutouId <= 0) {
    return err(appError('UNAUTHORIZED', 'Usuário não autenticado.'));
  }

  try {
    const db = createDbClient();
    const { data, error } = await db.rpc('bulk_atribuir_responsavel_expedientes', {
      p_expediente_ids: expedienteIds,
      p_responsavel_id: responsavelId,
      p_usuario_id: usuarioExecutouId,
    });

    if (error) {
      return err(appError('DATABASE_ERROR', error.message));
    }

    const payload = data as { atualizados: number; total: number } | null;
    return {
      success: true,
      data: {
        atualizados: payload?.atualizados ?? expedienteIds.length,
        total: payload?.total ?? expedienteIds.length,
      },
    };
  } catch (error) {
    return err(appError('DATABASE_ERROR', 'Erro ao transferir responsável em massa.', undefined, error instanceof Error ? error : undefined));
  }
}

/**
 * Baixa múltiplos expedientes numa única transação Postgres.
 * Falha atomicamente se qualquer expediente estiver já baixado ou não for
 * encontrado — nenhuma mudança é persistida nesse caso.
 */
export async function bulkBaixar(
  expedienteIds: number[],
  justificativaBaixa: string,
  usuarioExecutouId: number,
  baixadoEm: Date = new Date()
): Promise<Result<{ atualizados: number; total: number }>> {
  if (expedienteIds.length === 0) {
    return err(appError('VALIDATION_ERROR', 'Selecione pelo menos um expediente.'));
  }
  if (!justificativaBaixa || !justificativaBaixa.trim()) {
    return err(appError('VALIDATION_ERROR', 'Justificativa é obrigatória para baixa em massa.'));
  }
  if (usuarioExecutouId <= 0) {
    return err(appError('UNAUTHORIZED', 'Usuário não autenticado.'));
  }

  try {
    const db = createDbClient();
    const { data, error } = await db.rpc('bulk_baixar_expedientes', {
      p_expediente_ids: expedienteIds,
      p_justificativa: justificativaBaixa,
      p_baixado_em: baixadoEm.toISOString(),
      p_usuario_id: usuarioExecutouId,
    });

    if (error) {
      // A RPC usa RAISE EXCEPTION para violações de invariante (já baixados, ids inexistentes).
      return err(appError('BAD_REQUEST', error.message));
    }

    const payload = data as { atualizados: number; total: number } | null;
    return {
      success: true,
      data: {
        atualizados: payload?.atualizados ?? expedienteIds.length,
        total: payload?.total ?? expedienteIds.length,
      },
    };
  } catch (error) {
    return err(appError('DATABASE_ERROR', 'Erro ao baixar expedientes em massa.', undefined, error instanceof Error ? error : undefined));
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
    const { data: { user }, error: authError } = await db.auth.getUser();
    if (!authError && user?.id) {
      const { data: userData } = await db.from('usuarios').select('id').eq('auth_user_id', user.id).single();
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
