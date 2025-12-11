/**
 * EXPEDIENTES SERVICE - Camada de Negócio
 */

import {
  createExpedienteSchema,
  updateExpedienteSchema,
  baixaExpedienteSchema,
  ListarExpedientesParams,
  Expediente,
  // Legacy types
  ListarPendentesParams,
  ListarPendentesResult,
  ListarPendentesAgrupadoResult,
  AgruparPorPendente,
  PendenteManifestacao,
  ExpedientesFilters,
  // Enums
  OrigemExpediente,
} from './types';
import * as repository from './repository';
import type { ExpedienteInsertInput, ExpedienteUpdateInput } from './repository';
import { Result, err, appError, PaginatedResponse } from '@/core/common/types';
import { z } from 'zod';
import { createDbClient } from '@/core/common/db';
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
    } catch {}
    appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
  } catch (fileError) {
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
            // TODO: O que fazer se o log falhar? Por enquanto, apenas logamos o erro no servidor.
            console.error('Falha ao registrar log de baixa de expediente:', rpcError);
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

// =============================================================================
// LEGACY SERVICES (MIGRATED FROM BACKEND)
// =============================================================================

/**
 * Converte Expediente (camelCase) para PendenteManifestacao (snake_case)
 */
function toPendenteManifestacao(exp: Expediente): PendenteManifestacao {
  return {
    id: exp.id,
    id_pje: exp.idPje ?? 0,
    advogado_id: exp.advogadoId ?? 0,
    processo_id: exp.processoId,
    trt: exp.trt,
    grau: exp.grau,
    numero_processo: exp.numeroProcesso,
    descricao_orgao_julgador: exp.descricaoOrgaoJulgador ?? '',
    classe_judicial: exp.classeJudicial ?? '',
    numero: exp.numero ? parseInt(exp.numero) : 0,
    segredo_justica: exp.segredoJustica,
    codigo_status_processo: exp.codigoStatusProcesso ?? '',
    prioridade_processual: exp.prioridadeProcessual ? 1 : 0,
    nome_parte_autora: exp.nomeParteAutora ?? '',
    qtde_parte_autora: exp.qtdeParteAutora ?? 0,
    nome_parte_re: exp.nomeParteRe ?? '',
    qtde_parte_re: exp.qtdeParteRe ?? 0,
    data_autuacao: exp.dataAutuacao ?? '',
    juizo_digital: exp.juizoDigital,
    data_arquivamento: exp.dataArquivamento,
    id_documento: exp.idDocumento ? parseInt(exp.idDocumento) : null,
    data_ciencia_parte: exp.dataCienciaParte,
    data_prazo_legal_parte: exp.dataPrazoLegalParte,
    data_criacao_expediente: exp.dataCriacaoExpediente,
    prazo_vencido: exp.prazoVencido,
    sigla_orgao_julgador: exp.siglaOrgaoJulgador,
    baixado_em: exp.baixadoEm,
    protocolo_id: exp.protocoloId,
    justificativa_baixa: exp.justificativaBaixa,
    responsavel_id: exp.responsavelId,
    tipo_expediente_id: exp.tipoExpedienteId,
    descricao_arquivos: exp.descricaoArquivos,
    arquivo_nome: exp.arquivoNome,
    arquivo_url: exp.arquivoUrl,
    arquivo_bucket: exp.arquivoBucket,
    arquivo_key: exp.arquivoKey,
    observacoes: exp.observacoes,
    created_at: exp.createdAt,
    updated_at: exp.updatedAt,
  };
}

export async function obterPendentes(
  params: ListarPendentesParams & { agrupar_por?: AgruparPorPendente }
): Promise<Result<ListarPendentesResult | ListarPendentesAgrupadoResult>> {
  // Mapear filtros legacy para features params
  const repoParams: ListarExpedientesParams = {
    pagina: params.pagina,
    limite: params.agrupar_por ? 1000 : (params.limite ?? 50), // Se agrupar, buscar mais linhas
    busca: params.busca,
    trt: params.trt as any,
    grau: params.grau as any,
    responsavelId: params.responsavel_id === 'null' ? 'null' : (typeof params.responsavel_id === 'number' ? params.responsavel_id : undefined),
    tipoExpedienteId: params.tipo_expediente_id === 'null' ? undefined : (params.tipo_expediente_id as number),
    semTipo: params.sem_tipo || params.tipo_expediente_id === 'null',
    semResponsavel: params.sem_responsavel || params.responsavel_id === 'null',
    baixado: params.baixado,
    prazoVencido: params.prazo_vencido,
    dataPrazoLegalInicio: params.data_prazo_legal_inicio,
    dataPrazoLegalFim: params.data_prazo_legal_fim,
    dataCienciaInicio: params.data_ciencia_inicio,
    dataCienciaFim: params.data_ciencia_fim,
    dataCriacaoExpedienteInicio: params.data_criacao_expediente_inicio,
    dataCriacaoExpedienteFim: params.data_criacao_expediente_fim,
    classeJudicial: params.classe_judicial,
    codigoStatusProcesso: params.codigo_status_processo,
    segredoJustica: params.segredo_justica,
    juizoDigital: params.juizo_digital,
    dataAutuacaoInicio: params.data_autuacao_inicio,
    dataAutuacaoFim: params.data_autuacao_fim,
    dataArquivamentoInicio: params.data_arquivamento_inicio,
    dataArquivamentoFim: params.data_arquivamento_fim,
    ordenarPor: params.ordenar_por as any, // TODO: Map sort keys if incompatible
    ordem: params.ordem,
  };

  const result = await repository.findAllExpedientes(repoParams);

  if (!result.success) return result as any;

  const expedientes = result.data.data;
  const pendentes = expedientes.map(toPendenteManifestacao);

  // Lógica de Agrupamento
  if (params.agrupar_por) {
    const grupos = new Map<string, PendenteManifestacao[]>();
    const incluirContagem = params.incluir_contagem !== false;

    for (const item of pendentes) {
      let chave = 'outros';
      // Implementação simplificada de chaves - expandir conforme necessidade
      if (params.agrupar_por === 'trt') chave = item.trt;
      else if (params.agrupar_por === 'grau') chave = item.grau;
      else if (params.agrupar_por === 'responsavel_id') chave = item.responsavel_id?.toString() ?? 'sem_responsavel';
      else if (params.agrupar_por === 'classe_judicial') chave = item.classe_judicial;
      else if (params.agrupar_por === 'codigo_status_processo') chave = item.codigo_status_processo;
      else if (params.agrupar_por === 'orgao_julgador') chave = item.descricao_orgao_julgador;
      else if (params.agrupar_por === 'prazo_vencido') chave = item.prazo_vencido ? 'vencido' : 'no_prazo';
      // ... datas e outros cases simplificados por brevidade

      if (!grupos.has(chave)) grupos.set(chave, []);
      grupos.get(chave)!.push(item);
    }

    const agrupamentos = Array.from(grupos.entries()).map(([grupo, items]) => ({
      grupo,
      quantidade: items.length,
      pendentes: incluirContagem ? undefined : items,
    })).sort((a, b) => b.quantidade - a.quantidade);

    return {
      success: true,
      data: {
        agrupamentos,
        total: pendentes.length,
      } as ListarPendentesAgrupadoResult
    };
  }

  // Retorno padrão
  return {
    success: true,
    data: {
      pendentes,
      total: result.data.pagination.total,
      pagina: result.data.pagination.page,
      limite: result.data.pagination.limit,
      totalPaginas: result.data.pagination.totalPages,
    } as ListarPendentesResult
  };
}

export async function buscarPendentesPorClienteCPF(cpf: string): Promise<Result<PendenteManifestacao[]>> {
  const result = await repository.findExpedientesByClienteCPF(cpf);
  if (!result.success) return result as any;
  return {
    success: true,
    data: result.data.map(toPendenteManifestacao)
  };
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
): Promise<Result<PendenteManifestacao>> {
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
  if (!updateResult.success) return updateResult as any;

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
    data: toPendenteManifestacao(updateResult.data)
  };
}
