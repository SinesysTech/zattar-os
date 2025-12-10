/**
 * EXPEDIENTES SERVICE - Camada de Negócio
 */

import {
  createExpedienteSchema,
  updateExpedienteSchema,
  baixaExpedienteSchema,
  ListarExpedientesParams,
} from './domain';
import * as repository from './repository';
import { Result, ok, err, appError, PaginatedResponse } from '@/core/common/types';
import { Expediente } from './domain';
import { z } from 'zod';
import { createDbClient } from '../common/db';

function snakeToCamel(obj: Record<string, any>): Record<string, any> {
  const newObj: Record<string, any> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/([-_][a-z])/g, (group) =>
        group.toUpperCase().replace('-', '').replace('_', '')
      );
      newObj[camelKey] = obj[key];
    }
  }
  return newObj;
}


function camelToSnake(obj: Record<string, any>): Record<string, any> {
    const newObj: Record<string, any> = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
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

  const dataForRepo = camelToSnake(validation.data);

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

  const dataForRepo = camelToSnake(validation.data);


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

    const { protocoloId, justificativaBaixa, dataBaixa } = validation.data;
    const baixaResult = await repository.baixarExpediente(id, {
        protocoloId: protocoloId,
        justificativaBaixa: justificativaBaixa,
        baixadoEm: dataBaixa,
    });

    if (baixaResult.success) {
        const db = createDbClient();
        const { error: rpcError } = await db.rpc('registrar_baixa_expediente', {
            p_expediente_id: id,
            p_usuario_id: userId,
            p_protocolo_id: protocoloId || null,
            p_justificativa: justificativaBaixa || null,
        });
        if (rpcError) {
            // TODO: O que fazer se o log falhar? Por enquanto, apenas logamos o erro no servidor.
            console.error('Falha ao registrar log de baixa de expediente:', rpcError);
        }
    }

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
