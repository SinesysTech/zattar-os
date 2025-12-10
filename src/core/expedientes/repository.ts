/**
 * EXPEDIENTES REPOSITORY - Camada de Persistencia
 */

import { createDbClient } from '@/core/common/db';
import { Result, ok, err, appError, PaginatedResponse } from '@/core/common/types';
import {
  Expediente,
  ListarExpedientesParams,
  GrauTribunal,
  CodigoTribunal,
  OrigemExpediente,
} from './domain';

// =============================================================================
// CONSTANTES
// =============================================================================

const TABLE_EXPEDIENTES = 'expedientes';
const TABLE_ACERVO = 'acervo';
const TABLE_TIPOS_EXPEDIENTES = 'tipos_expedientes';

// =============================================================================
// CONVERSORES
// =============================================================================

function converterParaExpediente(data: Record<string, any>): Expediente {
  return {
    id: data.id,
    idPje: data.id_pje,
    advogadoId: data.advogado_id,
    processoId: data.processo_id,
    trt: data.trt,
    grau: data.grau,
    numeroProcesso: data.numero_processo,
    descricaoOrgaoJulgador: data.descricao_orgao_julgador,
    classeJudicial: data.classe_judicial,
    numero: data.numero,
    segredoJustica: data.segredo_justica,
    codigoStatusProcesso: data.codigo_status_processo,
    prioridadeProcessual: data.prioridade_processual,
    nomeParteAutora: data.nome_parte_autora,
    qtdeParteAutora: data.qtde_parte_autora,
    nomeParteRe: data.nome_parte_re,
    qtdeParteRe: data.qtde_parte_re,
    dataAutuacao: data.data_autuacao,
    juizoDigital: data.juizo_digital,
    dataArquivamento: data.data_arquivamento,
    idDocumento: data.id_documento,
    dataCienciaParte: data.data_ciencia_parte,
    dataPrazoLegalParte: data.data_prazo_legal_parte,
    dataCriacaoExpediente: data.data_criacao_expediente,
    prazoVencido: data.prazo_vencido,
    siglaOrgaoJulgador: data.sigla_orgao_julgador,
    dadosAnteriores: data.dados_anteriores,
    responsavelId: data.responsavel_id,
    baixadoEm: data.baixado_em,
    protocoloId: data.protocolo_id,
    justificativaBaixa: data.justificativa_baixa,
    tipoExpedienteId: data.tipo_expediente_id,
    descricaoArquivos: data.descricao_arquivos,
    arquivoNome: data.arquivo_nome,
    arquivoUrl: data.arquivo_url,
    arquivoBucket: data.arquivo_bucket,
    arquivoKey: data.arquivo_key,
    observacoes: data.observacoes,
    origem: data.origem,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function parseDate(dateString: string | null | undefined): string | null {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

// =============================================================================
// FUNCOES DE LEITURA
// =============================================================================

export async function findExpedienteById(id: number): Promise<Result<Expediente | null>> {
  try {
    const db = createDbClient();
    const { data, error } = await db.from(TABLE_EXPEDIENTES).select('*').eq('id', id).single();
    if (error) {
      if (error.code === 'PGRST116') return ok(null);
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }
    return ok(converterParaExpediente(data));
  } catch (error) {
    return err(appError('DATABASE_ERROR', 'Erro ao buscar expediente.', undefined, error instanceof Error ? error : undefined));
  }
}

export async function findAllExpedientes(params: ListarExpedientesParams = {}): Promise<Result<PaginatedResponse<Expediente>>> {
  try {
    const db = createDbClient();
    const pagina = params.pagina ?? 1;
    const limite = params.limite ?? 50;
    const offset = (pagina - 1) * limite;

    let query = db.from(TABLE_EXPEDIENTES).select('*', { count: 'exact' });

    if (params.busca) {
      query = query.or(`numero_processo.ilike.%${params.busca}%,observacoes.ilike.%${params.busca}%`);
    }
    if (params.trt) query = query.eq('trt', params.trt);
    if (params.grau) query = query.eq('grau', params.grau);
    if (params.responsavelId) {
      if (params.responsavelId === 'null') query = query.is('responsavel_id', null);
      else query = query.eq('responsavel_id', params.responsavelId);
    }
    if (params.tipoExpedienteId) query = query.eq('tipo_expediente_id', params.tipoExpedienteId);
    if (params.semTipo) query = query.is('tipo_expediente_id', null);
    if (params.semResponsavel) query = query.is('responsavel_id', null);
    if (params.baixado === true) query = query.not('baixado_em', 'is', null);
    if (params.baixado === false) query = query.is('baixado_em', null);
    if (params.prazoVencido) query = query.eq('prazo_vencido', true);
    if (params.dataPrazoLegalInicio) query = query.gte('data_prazo_legal_parte', params.dataPrazoLegalInicio);
    if (params.dataPrazoLegalFim) query = query.lte('data_prazo_legal_parte', params.dataPrazoLegalFim);
    if (params.dataCienciaInicio) query = query.gte('data_ciencia_parte', params.dataCienciaInicio);
    if (params.dataCienciaFim) query = query.lte('data_ciencia_parte', params.dataCienciaFim);
    if (params.dataCriacaoExpedienteInicio) query = query.gte('data_criacao_expediente', params.dataCriacaoExpedienteInicio);
    if (params.dataCriacaoExpedienteFim) query = query.lte('data_criacao_expediente', params.dataCriacaoExpedienteFim);
    if (params.classeJudicial) query = query.ilike('classe_judicial', `%${params.classeJudicial}%`);
    if (params.codigoStatusProcesso) query = query.eq('codigo_status_processo', params.codigoStatusProcesso);
    if (params.segretoJustica) query = query.eq('segredo_justica', params.segretoJustica);
    if (params.juizoDigital) query = query.eq('juizo_digital', params.juizoDigital);
    if (params.dataAutuacaoInicio) query = query.gte('data_autuacao', params.dataAutuacaoInicio);
    if (params.dataAutuacaoFim) query = query.lte('data_autuacao', params.dataAutuacaoFim);
    if (params.dataArquivamentoInicio) query = query.gte('data_arquivamento', params.dataArquivamentoInicio);
    if (params.dataArquivamentoFim) query = query.lte('data_arquivamento', params.dataArquivamentoFim);

    const ordenarPor = params.ordenarPor ?? 'data_prazo_legal_parte';
    const ordem = params.ordem ?? 'asc';
    query = query.order(ordenarPor, { ascending: ordem === 'asc' });

    query = query.range(offset, offset + limite - 1);

    const { data, error, count } = await query;

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    const expedientes = (data || []).map(converterParaExpediente);
    const total = count ?? 0;
    const totalPages = Math.ceil(total / limite);

    return ok({
      data: expedientes,
      pagination: {
        page: pagina,
        limit: limite,
        total,
        totalPages,
        hasMore: pagina < totalPages,
      },
    });
  } catch (error) {
    return err(appError('DATABASE_ERROR', 'Erro ao listar expedientes.', undefined, error instanceof Error ? error : undefined));
  }
}

export async function processoExists(processoId: number): Promise<Result<boolean>> {
  try {
    const db = createDbClient();
    const { data, error } = await db.from(TABLE_ACERVO).select('id').eq('id', processoId).maybeSingle();
    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }
    return ok(!!data);
  } catch (error) {
    return err(appError('DATABASE_ERROR', 'Erro ao verificar processo.', undefined, error instanceof Error ? error : undefined));
  }
}

export async function tipoExpedienteExists(tipoId: number): Promise<Result<boolean>> {
  try {
    const db = createDbClient();
    const { data, error } = await db.from(TABLE_TIPOS_EXPEDIENTES).select('id').eq('id', tipoId).maybeSingle();
    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }
    return ok(!!data);
  } catch (error) {
    return err(appError('DATABASE_ERROR', 'Erro ao verificar tipo de expediente.', undefined, error instanceof Error ? error : undefined));
  }
}

// =============================================================================
// FUNCOES DE ESCRITA
// =============================================================================

export async function saveExpediente(input: any): Promise<Result<Expediente>> {
  try {
    const db = createDbClient();
    const { data, error } = await db.from(TABLE_EXPEDIENTES).insert(input).select().single();
    if (error) {
      return err(appError('DATABASE_ERROR', `Erro ao criar expediente: ${error.message}`, { code: error.code }));
    }
    return ok(converterParaExpediente(data));
  } catch (error) {
    return err(appError('DATABASE_ERROR', 'Erro ao criar expediente.', undefined, error instanceof Error ? error : undefined));
  }
}

export async function updateExpediente(id: number, input: any, expedienteExistente: Expediente): Promise<Result<Expediente>> {
  try {
    const db = createDbClient();
    input.dados_anteriores = {
      ...expedienteExistente,
      dados_anteriores: undefined, // Evitar aninhamento
      updated_at_previous: expedienteExistente.updatedAt,
    };
    const { data, error } = await db.from(TABLE_EXPEDIENTES).update(input).eq('id', id).select().single();
    if (error) {
      return err(appError('DATABASE_ERROR', `Erro ao atualizar expediente: ${error.message}`, { code: error.code }));
    }
    return ok(converterParaExpediente(data));
  } catch (error) {
    return err(appError('DATABASE_ERROR', 'Erro ao atualizar expediente.', undefined, error instanceof Error ? error : undefined));
  }
}

export async function baixarExpediente(id: number, dados: { protocoloId?: number; justificativaBaixa?: string; baixadoEm?: string }): Promise<Result<Expediente>> {
  try {
    const db = createDbClient();
    const dadosUpdate = {
      baixado_em: dados.baixadoEm || new Date().toISOString(),
      protocolo_id: dados.protocoloId,
      justificativa_baixa: dados.justificativaBaixa,
    };
    const { data, error } = await db.from(TABLE_EXPEDIENTES).update(dadosUpdate).eq('id', id).select().single();
    if (error) {
      return err(appError('DATABASE_ERROR', `Erro ao baixar expediente: ${error.message}`, { code: error.code }));
    }
    return ok(converterParaExpediente(data));
  } catch (error) {
    return err(appError('DATABASE_ERROR', 'Erro ao baixar expediente.', undefined, error instanceof Error ? error : undefined));
  }
}

export async function reverterBaixaExpediente(id: number): Promise<Result<Expediente>> {
  try {
    const db = createDbClient();
    const dadosUpdate = {
      baixado_em: null,
      protocolo_id: null,
      justificativa_baixa: null,
    };
    const { data, error } = await db.from(TABLE_EXPEDIENTES).update(dadosUpdate).eq('id', id).select().single();
    if (error) {
      return err(appError('DATABASE_ERROR', `Erro ao reverter baixa: ${error.message}`, { code: error.code }));
    }
    return ok(converterParaExpediente(data));
  } catch (error) {
    return err(appError('DATABASE_ERROR', 'Erro ao reverter baixa.', undefined, error instanceof Error ? error : undefined));
  }
}
