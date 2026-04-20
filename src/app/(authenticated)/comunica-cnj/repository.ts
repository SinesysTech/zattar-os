/**
 * COMUNICA CNJ REPOSITORY - Camada de Persistência
 * Operações CRUD na tabela comunica_cnj com pattern Result<T>
 */

import { createServiceClient } from "@/lib/supabase/service-client";
import { toDateString } from "@/lib/date-utils";
import { Result, ok, err, appError, PaginatedResponse } from "@/types";
import type {
  ComunicacaoCNJ,
  InserirComunicacaoParams,
  ListarComunicacoesParams,
  MatchParams,
  BatchResult,
  MeioComunicacao,
  ComunicacaoDestinatario,
  ComunicacaoDestinatarioAdvogado,
  GazetteMetrics,
  SyncLogEntry,
  GazetteView,
  GazetteFilters,
  ComunicacaoResumo,
  SalvarViewInput,
} from "./domain";

// =============================================================================
// CONSTANTES
// =============================================================================

const TABLE_COMUNICA_CNJ = "comunica_cnj";
const TABLE_EXPEDIENTES = "expedientes";

// =============================================================================
// CONVERSORES
// =============================================================================

function converterParaComunicacaoCNJ(
  data: Record<string, unknown>
): ComunicacaoCNJ {
  return {
    id: data.id as number,
    idCnj: data.id_cnj as number,
    hash: data.hash as string,
    numeroComunicacao: data.numero_comunicacao as number | null,
    numeroProcesso: data.numero_processo as string,
    numeroProcessoMascara: data.numero_processo_mascara as string | null,
    siglaTribunal: data.sigla_tribunal as string,
    orgaoId: data.orgao_id as number | null,
    nomeOrgao: data.nome_orgao as string | null,
    tipoComunicacao: data.tipo_comunicacao as string | null,
    tipoDocumento: data.tipo_documento as string | null,
    nomeClasse: data.nome_classe as string | null,
    codigoClasse: data.codigo_classe as string | null,
    meio: data.meio as MeioComunicacao,
    meioCompleto: data.meio_completo as string | null,
    texto: data.texto as string | null,
    link: data.link as string | null,
    dataDisponibilizacao: data.data_disponibilizacao as string,
    ativo: data.ativo as boolean,
    status: data.status as string | null,
    motivoCancelamento: data.motivo_cancelamento as string | null,
    dataCancelamento: data.data_cancelamento as string | null,
    destinatarios: data.destinatarios as ComunicacaoDestinatario[] | null,
    destinatariosAdvogados: data.destinatarios_advogados as
      | ComunicacaoDestinatarioAdvogado[]
      | null,
    expedienteId: data.expediente_id as number | null,
    advogadoId: data.advogado_id as number | null,
    metadados: data.metadados as Record<string, unknown> | null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

function converterParaBanco(
  data: InserirComunicacaoParams
): Record<string, unknown> {
  return {
    id_cnj: data.idCnj,
    hash: data.hash,
    numero_comunicacao: data.numeroComunicacao ?? null,
    numero_processo: data.numeroProcesso,
    numero_processo_mascara: data.numeroProcessoMascara ?? null,
    sigla_tribunal: data.siglaTribunal,
    orgao_id: data.orgaoId ?? null,
    nome_orgao: data.nomeOrgao ?? null,
    tipo_comunicacao: data.tipoComunicacao ?? null,
    tipo_documento: data.tipoDocumento ?? null,
    nome_classe: data.nomeClasse ?? null,
    codigo_classe: data.codigoClasse ?? null,
    meio: data.meio,
    meio_completo: data.meioCompleto ?? null,
    texto: data.texto ?? null,
    link: data.link ?? null,
    data_disponibilizacao: data.dataDisponibilizacao,
    ativo: data.ativo ?? true,
    status: data.status ?? null,
    motivo_cancelamento: data.motivoCancelamento ?? null,
    data_cancelamento: data.dataCancelamento ?? null,
    destinatarios: data.destinatarios ?? null,
    destinatarios_advogados: data.destinatariosAdvogados ?? null,
    expediente_id: data.expedienteId ?? null,
    advogado_id: data.advogadoId ?? null,
    metadados: data.metadados ?? null,
  };
}

// =============================================================================
// FUNÇÕES DE CONSULTA
// =============================================================================

export async function findComunicacaoByHash(
  hash: string
): Promise<Result<ComunicacaoCNJ | null>> {
  try {
    const db = createServiceClient();
    const { data, error } = await db
      .from(TABLE_COMUNICA_CNJ)
      .select("*")
      .eq("hash", hash)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return ok(null);
      }
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code })
      );
    }

    return ok(converterParaComunicacaoCNJ(data));
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao buscar comunicação por hash.",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function findComunicacaoById(
  id: number
): Promise<Result<ComunicacaoCNJ | null>> {
  try {
    const db = createServiceClient();
    const { data, error } = await db
      .from(TABLE_COMUNICA_CNJ)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return ok(null);
      }
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code })
      );
    }

    return ok(converterParaComunicacaoCNJ(data));
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao buscar comunicação por ID.",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function findAllComunicacoes(
  params: ListarComunicacoesParams
): Promise<Result<PaginatedResponse<ComunicacaoCNJ>>> {
  try {
    const db = createServiceClient();
    const page = params.page ?? 1;
    const limit = params.limit ?? 50;
    const offset = (page - 1) * limit;

    let query = db.from(TABLE_COMUNICA_CNJ).select("*", { count: "exact" });

    if (params.numeroProcesso) {
      query = query.eq("numero_processo", params.numeroProcesso);
    }

    if (params.siglaTribunal) {
      query = query.eq("sigla_tribunal", params.siglaTribunal);
    }

    if (params.dataInicio) {
      query = query.gte("data_disponibilizacao", params.dataInicio);
    }

    if (params.dataFim) {
      query = query.lte("data_disponibilizacao", params.dataFim);
    }

    if (params.advogadoId) {
      query = query.eq("advogado_id", params.advogadoId);
    }

    if (params.expedienteId) {
      query = query.eq("expediente_id", params.expedienteId);
    }

    if (params.semExpediente) {
      query = query.is("expediente_id", null);
    }

    const { data, error, count } = await query
      .order("data_disponibilizacao", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code })
      );
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return ok({
      data: (data ?? []).map(converterParaComunicacaoCNJ),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao listar comunicações.",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function existsComunicacao(
  hash: string
): Promise<Result<boolean>> {
  try {
    const db = createServiceClient();
    const { count, error } = await db
      .from(TABLE_COMUNICA_CNJ)
      .select("*", { count: "exact", head: true })
      .eq("hash", hash);

    if (error) {
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code })
      );
    }

    return ok((count ?? 0) > 0);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao verificar comunicação.",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

// =============================================================================
// FUNÇÕES DE PERSISTÊNCIA
// =============================================================================

export async function saveComunicacao(
  data: InserirComunicacaoParams
): Promise<Result<ComunicacaoCNJ | null>> {
  try {
    const db = createServiceClient();
    const dadosBanco = converterParaBanco(data);

    const { data: inserted, error } = await db
      .from(TABLE_COMUNICA_CNJ)
      .insert(dadosBanco)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        console.log(
          "[comunica-cnj-repository] Comunicação já existe (hash):",
          data.hash
        );
        return ok(null);
      }
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code })
      );
    }

    return ok(converterParaComunicacaoCNJ(inserted));
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao salvar comunicação.",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function saveComunicacoesBatch(
  comunicacoes: InserirComunicacaoParams[]
): Promise<Result<BatchResult>> {
  let inseridas = 0;
  let duplicadas = 0;
  let erros = 0;

  for (const comunicacao of comunicacoes) {
    const result = await saveComunicacao(comunicacao);
    if (!result.success) {
      erros++;
      console.error(
        "[comunica-cnj-repository] Erro ao inserir comunicação:",
        result.error
      );
    } else if (result.data === null) {
      duplicadas++;
    } else {
      inseridas++;
    }
  }

  return ok({ inseridas, duplicadas, erros });
}

// =============================================================================
// FUNÇÕES DE VINCULAÇÃO
// =============================================================================

export async function vincularExpediente(
  comunicacaoId: number,
  expedienteId: number
): Promise<Result<ComunicacaoCNJ>> {
  try {
    const db = createServiceClient();
    const { data, error } = await db
      .from(TABLE_COMUNICA_CNJ)
      .update({ expediente_id: expedienteId })
      .eq("id", comunicacaoId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return err(appError("NOT_FOUND", "Comunicação não encontrada."));
      }
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code })
      );
    }

    return ok(converterParaComunicacaoCNJ(data));
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao vincular expediente.",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function desvincularExpediente(
  comunicacaoId: number
): Promise<Result<ComunicacaoCNJ>> {
  try {
    const db = createServiceClient();
    const { data, error } = await db
      .from(TABLE_COMUNICA_CNJ)
      .update({ expediente_id: null })
      .eq("id", comunicacaoId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return err(appError("NOT_FOUND", "Comunicação não encontrada."));
      }
      return err(
        appError("DATABASE_ERROR", error.message, { code: error.code })
      );
    }

    return ok(converterParaComunicacaoCNJ(data));
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao desvincular expediente.",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

export async function findExpedienteCorrespondente(
  params: MatchParams
): Promise<Result<number | null>> {
  try {
    const db = createServiceClient();

    // Calcula data limite (3 dias antes)
    const dataDisp = new Date(params.dataDisponibilizacao);
    const dataLimite = new Date(dataDisp);
    dataLimite.setDate(dataLimite.getDate() - 3);

    const { data, error } = await db
      .from(TABLE_EXPEDIENTES)
      .select("id")
      .eq("numero_processo", params.numeroProcesso)
      .eq("trt", params.trt)
      .eq("grau", params.grau)
      .gte("data_criacao_expediente", toDateString(dataLimite))
      .lte("data_criacao_expediente", params.dataDisponibilizacao)
      .is("baixado_em", null) // Não baixado
      .order("data_criacao_expediente", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return ok(null);
      }
      console.log(
        "[comunica-cnj-repository] Erro ao buscar expediente:",
        error.message
      );
      return ok(null);
    }

    // Verifica se o expediente já tem comunicação vinculada
    const { count } = await db
      .from(TABLE_COMUNICA_CNJ)
      .select("*", { count: "exact", head: true })
      .eq("expediente_id", data.id);

    if (count && count > 0) {
      console.log(
        "[comunica-cnj-repository] Expediente já tem comunicação vinculada:",
        data.id
      );
      return ok(null);
    }

    return ok(data.id);
  } catch (error) {
    return err(
      appError(
        "DATABASE_ERROR",
        "Erro ao buscar expediente correspondente.",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

// =============================================================================
// GAZETTE FUSION - METRICAS
// =============================================================================

export async function findMetricas(): Promise<Result<GazetteMetrics>> {
  try {
    const client = await createServiceClient();

    const today = new Date().toISOString().split('T')[0];

    const [hojeRes, totalRes, vinculadosRes, orfaosRes] = await Promise.all([
      client
        .from(TABLE_COMUNICA_CNJ)
        .select('id', { count: 'exact', head: true })
        .gte('data_disponibilizacao', today)
        .then(r => r.count ?? 0),
      client
        .from(TABLE_COMUNICA_CNJ)
        .select('id', { count: 'exact', head: true })
        .then(r => r.count ?? 0),
      client
        .from(TABLE_COMUNICA_CNJ)
        .select('id', { count: 'exact', head: true })
        .not('expediente_id', 'is', null)
        .then(r => r.count ?? 0),
      client
        .from(TABLE_COMUNICA_CNJ)
        .select('id', { count: 'exact', head: true })
        .is('expediente_id', null)
        .then(r => r.count ?? 0),
    ]);

    const publicacoesHoje = hojeRes;
    const total = totalRes;
    const vinculados = vinculadosRes;
    const orfaos = orfaosRes;
    const pendentes = Math.max(0, total - vinculados - orfaos);

    return ok({
      publicacoesHoje,
      vinculados,
      totalCapturadas: total,
      pendentes,
      prazosCriticos: 0,
      orfaos,
      orfaosComSugestao: 0,
      taxaVinculacao: total > 0 ? Math.round((vinculados / total) * 100) : 0,
    });
  } catch (error) {
    return err(appError('DATABASE_ERROR', 'Erro ao buscar metricas.', undefined, error instanceof Error ? error : undefined));
  }
}

// =============================================================================
// GAZETTE FUSION - SYNC LOG
// =============================================================================

const TABLE_SYNC_LOG = 'comunica_cnj_sync_log';

function converterParaSyncLog(row: Record<string, unknown>): SyncLogEntry {
  return {
    id: row.id as number,
    tipo: row.tipo as SyncLogEntry['tipo'],
    status: row.status as SyncLogEntry['status'],
    totalProcessados: row.total_processados as number,
    novos: row.novos as number,
    duplicados: row.duplicados as number,
    vinculadosAuto: row.vinculados_auto as number,
    orfaos: row.orfaos as number,
    erros: (row.erros ?? []) as SyncLogEntry['erros'],
    parametros: (row.parametros ?? {}) as Record<string, unknown>,
    duracaoMs: row.duracao_ms as number | null,
    executadoPor: row.executado_por as number,
    createdAt: row.created_at as string,
  };
}

export async function saveSyncLog(
  data: Omit<SyncLogEntry, 'id' | 'createdAt'>
): Promise<Result<SyncLogEntry>> {
  try {
    const client = await createServiceClient();
    const { data: row, error } = await client
      .from(TABLE_SYNC_LOG)
      .insert({
        tipo: data.tipo,
        status: data.status,
        total_processados: data.totalProcessados,
        novos: data.novos,
        duplicados: data.duplicados,
        vinculados_auto: data.vinculadosAuto,
        orfaos: data.orfaos,
        erros: data.erros,
        parametros: data.parametros,
        duracao_ms: data.duracaoMs,
        executado_por: data.executadoPor,
      })
      .select()
      .single();

    if (error) return err(appError('DATABASE_ERROR', error.message));
    return ok(converterParaSyncLog(row));
  } catch (error) {
    return err(appError('DATABASE_ERROR', 'Erro ao salvar sync log.', undefined, error instanceof Error ? error : undefined));
  }
}

export async function findSyncLogs(limite: number = 10): Promise<Result<SyncLogEntry[]>> {
  try {
    const client = await createServiceClient();
    const { data: rows, error } = await client
      .from(TABLE_SYNC_LOG)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limite);

    if (error) return err(appError('DATABASE_ERROR', error.message));
    return ok((rows ?? []).map(converterParaSyncLog));
  } catch (error) {
    return err(appError('DATABASE_ERROR', 'Erro ao listar sync logs.', undefined, error instanceof Error ? error : undefined));
  }
}

// =============================================================================
// GAZETTE FUSION - VIEWS
// =============================================================================

const TABLE_VIEWS = 'comunica_cnj_views';

function converterParaView(row: Record<string, unknown>): GazetteView {
  return {
    id: row.id as number,
    nome: row.nome as string,
    icone: (row.icone as string) ?? 'bookmark',
    filtros: (row.filtros ?? {}) as GazetteFilters,
    colunas: (row.colunas ?? []) as string[],
    sort: (row.sort ?? { campo: 'data_disponibilizacao', direcao: 'desc' }) as GazetteView['sort'],
    densidade: (row.densidade as GazetteView['densidade']) ?? 'padrao',
    modoVisualizacao: (row.modo_visualizacao as GazetteView['modoVisualizacao']) ?? 'tabela',
    visibilidade: (row.visibilidade as GazetteView['visibilidade']) ?? 'pessoal',
    criadoPor: row.criado_por as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function findViews(usuarioId: number): Promise<Result<GazetteView[]>> {
  try {
    const client = await createServiceClient();
    const { data: rows, error } = await client
      .from(TABLE_VIEWS)
      .select('*')
      .or(`criado_por.eq.${usuarioId},visibilidade.eq.equipe`)
      .order('created_at', { ascending: true });

    if (error) return err(appError('DATABASE_ERROR', error.message));
    return ok((rows ?? []).map(converterParaView));
  } catch (error) {
    return err(appError('DATABASE_ERROR', 'Erro ao listar views.', undefined, error instanceof Error ? error : undefined));
  }
}

export async function saveView(
  data: SalvarViewInput & { criadoPor: number }
): Promise<Result<GazetteView>> {
  try {
    const client = await createServiceClient();
    const { data: row, error } = await client
      .from(TABLE_VIEWS)
      .insert({
        nome: data.nome,
        icone: data.icone,
        filtros: data.filtros,
        colunas: data.colunas,
        sort: data.sort,
        densidade: data.densidade,
        modo_visualizacao: data.modoVisualizacao,
        visibilidade: data.visibilidade,
        criado_por: data.criadoPor,
      })
      .select()
      .single();

    if (error) return err(appError('DATABASE_ERROR', error.message));
    return ok(converterParaView(row));
  } catch (error) {
    return err(appError('DATABASE_ERROR', 'Erro ao salvar view.', undefined, error instanceof Error ? error : undefined));
  }
}

export async function deleteView(viewId: number, usuarioId: number): Promise<Result<void>> {
  try {
    const client = await createServiceClient();
    const { error } = await client
      .from(TABLE_VIEWS)
      .delete()
      .eq('id', viewId)
      .eq('criado_por', usuarioId);

    if (error) return err(appError('DATABASE_ERROR', error.message));
    return ok(undefined);
  } catch (error) {
    return err(appError('DATABASE_ERROR', 'Erro ao deletar view.', undefined, error instanceof Error ? error : undefined));
  }
}

// =============================================================================
// GAZETTE FUSION - RESUMOS AI
// =============================================================================

const TABLE_RESUMOS = 'comunica_cnj_resumos';

export async function findResumo(comunicacaoId: number): Promise<Result<ComunicacaoResumo | null>> {
  try {
    const client = await createServiceClient();
    const { data: row, error } = await client
      .from(TABLE_RESUMOS)
      .select('*')
      .eq('comunicacao_id', comunicacaoId)
      .maybeSingle();

    if (error) return err(appError('DATABASE_ERROR', error.message));
    if (!row) return ok(null);
    return ok({
      id: row.id as number,
      comunicacaoId: row.comunicacao_id as number,
      resumo: row.resumo as string,
      tags: (row.tags ?? []) as ComunicacaoResumo['tags'],
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    });
  } catch (error) {
    return err(appError('DATABASE_ERROR', 'Erro ao buscar resumo.', undefined, error instanceof Error ? error : undefined));
  }
}

export async function saveResumo(
  comunicacaoId: number,
  resumo: string,
  tags: ComunicacaoResumo['tags']
): Promise<Result<ComunicacaoResumo>> {
  try {
    const client = await createServiceClient();
    const { data: row, error } = await client
      .from(TABLE_RESUMOS)
      .upsert(
        {
          comunicacao_id: comunicacaoId,
          resumo,
          tags,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'comunicacao_id' }
      )
      .select()
      .single();

    if (error) return err(appError('DATABASE_ERROR', error.message));
    return ok({
      id: row.id as number,
      comunicacaoId: row.comunicacao_id as number,
      resumo: row.resumo as string,
      tags: (row.tags ?? []) as ComunicacaoResumo['tags'],
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    });
  } catch (error) {
    return err(appError('DATABASE_ERROR', 'Erro ao salvar resumo.', undefined, error instanceof Error ? error : undefined));
  }
}
