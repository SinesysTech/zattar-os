/**
 * PROCESSOS REPOSITORY - Camada de Persistencia
 *
 * Este arquivo contem funcoes de acesso ao banco de dados para Processos.
 * Suporta todos os 19 filtros identificados na UI.
 *
 * CONVENCOES:
 * - Funcoes assincronas que retornam Result<T>
 * - Nomes descritivos: findById, findAll, save, update
 * - NUNCA fazer validacao de negocio aqui (apenas persistencia)
 * - NUNCA importar React/Next.js aqui
 */

import { createDbClient } from '@/core/common/db';
import { Result, ok, err, appError, PaginatedResponse } from '@/core/common/types';
import type {
  Processo,
  ProcessoUnificado,
  ProcessoInstancia,
  Movimentacao,
  CreateProcessoInput,
  UpdateProcessoInput,
  ListarProcessosParams,
  OrigemAcervo,
  GrauProcesso,
} from './domain';
import { StatusProcesso, mapCodigoStatusToEnum } from './domain';

// =============================================================================
// CONSTANTES
// =============================================================================

const TABLE_ACERVO = 'acervo';
const TABLE_ADVOGADOS = 'advogados';
const TABLE_USUARIOS = 'usuarios';

// =============================================================================
// CONVERSORES
// =============================================================================

/**
 * Converte dados do banco (snake_case) para entidade Processo (camelCase)
 */
function converterParaProcesso(data: Record<string, unknown>): Processo {
  const codigoStatus = (data.codigo_status_processo as string) || '';

  return {
    id: data.id as number,
    idPje: data.id_pje as number,
    advogadoId: data.advogado_id as number,
    origem: data.origem as OrigemAcervo,
    trt: data.trt as string,
    grau: data.grau as GrauProcesso,
    numeroProcesso: data.numero_processo as string,
    numero: data.numero as number,
    descricaoOrgaoJulgador: data.descricao_orgao_julgador as string,
    classeJudicial: data.classe_judicial as string,
    segredoJustica: (data.segredo_justica as boolean) ?? false,
    codigoStatusProcesso: codigoStatus,
    prioridadeProcessual: (data.prioridade_processual as number) ?? 0,
    nomeParteAutora: data.nome_parte_autora as string,
    qtdeParteAutora: (data.qtde_parte_autora as number) ?? 1,
    nomeParteRe: data.nome_parte_re as string,
    qtdeParteRe: (data.qtde_parte_re as number) ?? 1,
    dataAutuacao: data.data_autuacao as string,
    juizoDigital: (data.juizo_digital as boolean) ?? false,
    dataArquivamento: (data.data_arquivamento as string | null) ?? null,
    dataProximaAudiencia: (data.data_proxima_audiencia as string | null) ?? null,
    temAssociacao: (data.tem_associacao as boolean) ?? false,
    responsavelId: (data.responsavel_id as number | null) ?? null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
    // Campo derivado
    status: mapCodigoStatusToEnum(codigoStatus),
  };
}

/**
 * Converte dados do banco para ProcessoInstancia
 */
function converterParaInstancia(data: Record<string, unknown>, isGrauAtual: boolean): ProcessoInstancia {
  const codigoStatus = (data.codigo_status_processo as string) || '';

  return {
    id: data.id as number,
    grau: data.grau as GrauProcesso,
    origem: data.origem as OrigemAcervo,
    trt: data.trt as string,
    dataAutuacao: data.data_autuacao as string,
    status: mapCodigoStatusToEnum(codigoStatus),
    updatedAt: data.updated_at as string,
    isGrauAtual,
  };
}

/**
 * Agrupa processos por numero_processo para criar ProcessoUnificado[]
 */
function agruparProcessosUnificados(processos: Processo[]): ProcessoUnificado[] {
  const grupos = new Map<string, Processo[]>();

  // Agrupar por numero_processo
  for (const processo of processos) {
    const numeroBase = processo.numeroProcesso;
    if (!grupos.has(numeroBase)) {
      grupos.set(numeroBase, []);
    }
    grupos.get(numeroBase)!.push(processo);
  }

  const unificados: ProcessoUnificado[] = [];

  for (const [, instancias] of grupos) {
    // Ordenar por updated_at DESC para pegar o mais recente como principal
    instancias.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const principal = instancias[0];
    const grausAtivos = [...new Set(instancias.map((i) => i.grau))];

    const unificado: ProcessoUnificado = {
      id: principal.id,
      idPje: principal.idPje,
      advogadoId: principal.advogadoId,
      trt: principal.trt,
      numeroProcesso: principal.numeroProcesso,
      numero: principal.numero,
      descricaoOrgaoJulgador: principal.descricaoOrgaoJulgador,
      classeJudicial: principal.classeJudicial,
      segredoJustica: principal.segredoJustica,
      codigoStatusProcesso: principal.codigoStatusProcesso,
      prioridadeProcessual: principal.prioridadeProcessual,
      nomeParteAutora: principal.nomeParteAutora,
      qtdeParteAutora: principal.qtdeParteAutora,
      nomeParteRe: principal.nomeParteRe,
      qtdeParteRe: principal.qtdeParteRe,
      dataAutuacao: principal.dataAutuacao,
      juizoDigital: principal.juizoDigital,
      dataArquivamento: principal.dataArquivamento,
      dataProximaAudiencia: principal.dataProximaAudiencia,
      temAssociacao: principal.temAssociacao,
      responsavelId: principal.responsavelId,
      createdAt: principal.createdAt,
      updatedAt: principal.updatedAt,
      status: principal.status,
      grauAtual: principal.grau,
      statusGeral: principal.status,
      instances: instancias.map((inst, index) =>
        converterParaInstancia(
          {
            id: inst.id,
            grau: inst.grau,
            origem: inst.origem,
            trt: inst.trt,
            data_autuacao: inst.dataAutuacao,
            codigo_status_processo: inst.codigoStatusProcesso,
            updated_at: inst.updatedAt,
          },
          index === 0
        )
      ),
      grausAtivos,
    };

    unificados.push(unificado);
  }

  return unificados;
}

// =============================================================================
// FUNCOES DE LEITURA
// =============================================================================

/**
 * Busca um processo pelo ID
 */
export async function findProcessoById(id: number): Promise<Result<Processo | null>> {
  try {
    const db = createDbClient();

    const { data, error } = await db.from(TABLE_ACERVO).select('*').eq('id', id).single();

    if (error) {
      if (error.code === 'PGRST116') {
        return ok(null);
      }
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(converterParaProcesso(data as Record<string, unknown>));
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao buscar processo',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Lista processos com filtros e paginacao (suporta 19 filtros)
 *
 * Ordem de aplicacao dos filtros (performance):
 * 1. Filtros indexados (advogado_id, origem, trt, grau, numero_processo)
 * 2. Filtros de texto (ilike)
 * 3. Filtros booleanos
 * 4. Filtros de data (ranges)
 * 5. Busca geral (mais custoso)
 */
export async function findAllProcessos(
  params: ListarProcessosParams = {}
): Promise<Result<PaginatedResponse<Processo | ProcessoUnificado>>> {
  try {
    const db = createDbClient();

    const pagina = params.pagina ?? 1;
    const limite = params.limite ?? 50;
    const offset = (pagina - 1) * limite;

    let query = db.from(TABLE_ACERVO).select('*', { count: 'exact' });

    // =======================================================================
    // FILTROS INDEXADOS (aplicar primeiro para performance)
    // =======================================================================

    if (params.advogadoId !== undefined) {
      query = query.eq('advogado_id', params.advogadoId);
    }

    if (params.origem !== undefined) {
      query = query.eq('origem', params.origem);
    }

    if (params.trt !== undefined) {
      query = query.eq('trt', params.trt);
    }

    if (params.grau !== undefined) {
      query = query.eq('grau', params.grau);
    }

    if (params.numeroProcesso !== undefined) {
      query = query.eq('numero_processo', params.numeroProcesso);
    }

    if (params.responsavelId !== undefined) {
      query = query.eq('responsavel_id', params.responsavelId);
    }

    // =======================================================================
    // FILTROS DE TEXTO (ilike para busca parcial)
    // =======================================================================

    if (params.nomeParteAutora !== undefined && params.nomeParteAutora.trim()) {
      query = query.ilike('nome_parte_autora', `%${params.nomeParteAutora.trim()}%`);
    }

    if (params.nomeParteRe !== undefined && params.nomeParteRe.trim()) {
      query = query.ilike('nome_parte_re', `%${params.nomeParteRe.trim()}%`);
    }

    if (params.descricaoOrgaoJulgador !== undefined && params.descricaoOrgaoJulgador.trim()) {
      query = query.ilike('descricao_orgao_julgador', `%${params.descricaoOrgaoJulgador.trim()}%`);
    }

    if (params.classeJudicial !== undefined && params.classeJudicial.trim()) {
      query = query.ilike('classe_judicial', `%${params.classeJudicial.trim()}%`);
    }

    if (params.codigoStatusProcesso !== undefined && params.codigoStatusProcesso.trim()) {
      query = query.eq('codigo_status_processo', params.codigoStatusProcesso.trim());
    }

    // =======================================================================
    // FILTROS BOOLEANOS
    // =======================================================================

    if (params.segredoJustica !== undefined) {
      query = query.eq('segredo_justica', params.segredoJustica);
    }

    if (params.juizoDigital !== undefined) {
      query = query.eq('juizo_digital', params.juizoDigital);
    }

    if (params.temAssociacao !== undefined) {
      query = query.eq('tem_associacao', params.temAssociacao);
    }

    if (params.temProximaAudiencia === true) {
      query = query.not('data_proxima_audiencia', 'is', null);
    }

    if (params.semResponsavel === true) {
      query = query.is('responsavel_id', null);
    }

    // =======================================================================
    // FILTROS DE DATA (ranges)
    // =======================================================================

    if (params.dataAutuacaoInicio !== undefined) {
      query = query.gte('data_autuacao', params.dataAutuacaoInicio);
    }

    if (params.dataAutuacaoFim !== undefined) {
      query = query.lte('data_autuacao', params.dataAutuacaoFim);
    }

    if (params.dataArquivamentoInicio !== undefined) {
      query = query.gte('data_arquivamento', params.dataArquivamentoInicio);
    }

    if (params.dataArquivamentoFim !== undefined) {
      query = query.lte('data_arquivamento', params.dataArquivamentoFim);
    }

    if (params.dataProximaAudienciaInicio !== undefined) {
      query = query.gte('data_proxima_audiencia', params.dataProximaAudienciaInicio);
    }

    if (params.dataProximaAudienciaFim !== undefined) {
      query = query.lte('data_proxima_audiencia', params.dataProximaAudienciaFim);
    }

    // =======================================================================
    // BUSCA GERAL (mais custoso - aplicar por ultimo)
    // =======================================================================

    if (params.busca !== undefined && params.busca.trim()) {
      const busca = params.busca.trim();
      // Busca em multiplos campos usando OR
      query = query.or(
        `numero_processo.ilike.%${busca}%,` +
          `nome_parte_autora.ilike.%${busca}%,` +
          `nome_parte_re.ilike.%${busca}%,` +
          `descricao_orgao_julgador.ilike.%${busca}%`
      );
    }

    // =======================================================================
    // ORDENACAO
    // =======================================================================

    const ordenarPor = params.ordenarPor ?? 'data_autuacao';
    const ordem = params.ordem ?? 'desc';
    query = query.order(ordenarPor, { ascending: ordem === 'asc' });

    // =======================================================================
    // PAGINACAO
    // =======================================================================

    query = query.range(offset, offset + limite - 1);

    // =======================================================================
    // EXECUCAO
    // =======================================================================

    const { data, error, count } = await query;

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    const processos = (data || []).map((item) =>
      converterParaProcesso(item as Record<string, unknown>)
    );
    const total = count ?? 0;
    const totalPages = Math.ceil(total / limite);

    // Se unified = true (default), agrupar por numero_processo
    const unified = params.unified !== false;

    if (unified) {
      const unificados = agruparProcessosUnificados(processos);
      return ok({
        data: unificados,
        pagination: {
          page: pagina,
          limit: limite,
          total,
          totalPages,
          hasMore: pagina < totalPages,
        },
      });
    }

    return ok({
      data: processos,
      pagination: {
        page: pagina,
        limit: limite,
        total,
        totalPages,
        hasMore: pagina < totalPages,
      },
    });
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao listar processos',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Busca timeline/movimentacoes de um processo
 *
 * PLACEHOLDER: Implementacao futura na Fase 4 (Integracao PJE)
 */
export async function findTimelineByProcessoId(
  processoId: number
): Promise<Result<Movimentacao[]>> {
  // TODO: Implementar quando tabela de movimentacoes estiver disponivel
  // Por ora, retorna array vazio
  console.log(`[PLACEHOLDER] findTimelineByProcessoId chamado para processo ${processoId}`);
  return ok([]);
}

// =============================================================================
// FUNCOES DE VALIDACAO DE RELACIONAMENTOS
// =============================================================================

/**
 * Verifica se um advogado existe
 */
export async function advogadoExists(advogadoId: number): Promise<Result<boolean>> {
  try {
    const db = createDbClient();

    const { data, error } = await db
      .from(TABLE_ADVOGADOS)
      .select('id')
      .eq('id', advogadoId)
      .maybeSingle();

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(!!data);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao verificar advogado',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Verifica se um usuario (responsavel) existe
 */
export async function usuarioExists(usuarioId: number): Promise<Result<boolean>> {
  try {
    const db = createDbClient();

    const { data, error } = await db
      .from(TABLE_USUARIOS)
      .select('id')
      .eq('id', usuarioId)
      .maybeSingle();

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(!!data);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao verificar usuario',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

// =============================================================================
// FUNCOES DE ESCRITA
// =============================================================================

/**
 * Cria um novo processo no banco
 */
export async function saveProcesso(input: CreateProcessoInput): Promise<Result<Processo>> {
  try {
    const db = createDbClient();

    // Preparar dados para insercao (camelCase -> snake_case)
    const dadosInsercao: Record<string, unknown> = {
      id_pje: input.idPje,
      advogado_id: input.advogadoId,
      origem: input.origem,
      trt: input.trt,
      grau: input.grau,
      numero_processo: input.numeroProcesso,
      numero: input.numero,
      descricao_orgao_julgador: input.descricaoOrgaoJulgador,
      classe_judicial: input.classeJudicial,
      codigo_status_processo: input.codigoStatusProcesso,
      nome_parte_autora: input.nomeParteAutora,
      nome_parte_re: input.nomeParteRe,
      data_autuacao: input.dataAutuacao,
      segredo_justica: input.segredoJustica ?? false,
      juizo_digital: input.juizoDigital ?? false,
      tem_associacao: input.temAssociacao ?? false,
      prioridade_processual: input.prioridadeProcessual ?? 0,
      qtde_parte_autora: input.qtdeParteAutora ?? 1,
      qtde_parte_re: input.qtdeParteRe ?? 1,
      data_arquivamento: input.dataArquivamento ?? null,
      data_proxima_audiencia: input.dataProximaAudiencia ?? null,
      responsavel_id: input.responsavelId ?? null,
    };

    const { data, error } = await db
      .from(TABLE_ACERVO)
      .insert(dadosInsercao)
      .select()
      .single();

    if (error) {
      // Tratar erro de constraint (processo duplicado)
      if (error.code === '23505') {
        return err(
          appError('CONFLICT', 'Processo ja existe com estes dados', {
            code: error.code,
            constraint: error.details,
          })
        );
      }
      return err(
        appError('DATABASE_ERROR', `Erro ao criar processo: ${error.message}`, {
          code: error.code,
        })
      );
    }

    return ok(converterParaProcesso(data as Record<string, unknown>));
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao criar processo',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Atualiza um processo existente
 */
export async function updateProcesso(
  id: number,
  input: UpdateProcessoInput,
  processoExistente: Processo
): Promise<Result<Processo>> {
  try {
    const db = createDbClient();

    // Preparar dados para atualizacao (apenas campos fornecidos)
    const dadosAtualizacao: Record<string, unknown> = {};

    if (input.idPje !== undefined) {
      dadosAtualizacao.id_pje = input.idPje;
    }
    if (input.advogadoId !== undefined) {
      dadosAtualizacao.advogado_id = input.advogadoId;
    }
    if (input.origem !== undefined) {
      dadosAtualizacao.origem = input.origem;
    }
    if (input.trt !== undefined) {
      dadosAtualizacao.trt = input.trt;
    }
    if (input.grau !== undefined) {
      dadosAtualizacao.grau = input.grau;
    }
    if (input.numeroProcesso !== undefined) {
      dadosAtualizacao.numero_processo = input.numeroProcesso;
    }
    if (input.numero !== undefined) {
      dadosAtualizacao.numero = input.numero;
    }
    if (input.descricaoOrgaoJulgador !== undefined) {
      dadosAtualizacao.descricao_orgao_julgador = input.descricaoOrgaoJulgador;
    }
    if (input.classeJudicial !== undefined) {
      dadosAtualizacao.classe_judicial = input.classeJudicial;
    }
    if (input.codigoStatusProcesso !== undefined) {
      dadosAtualizacao.codigo_status_processo = input.codigoStatusProcesso;
    }
    if (input.nomeParteAutora !== undefined) {
      dadosAtualizacao.nome_parte_autora = input.nomeParteAutora;
    }
    if (input.nomeParteRe !== undefined) {
      dadosAtualizacao.nome_parte_re = input.nomeParteRe;
    }
    if (input.dataAutuacao !== undefined) {
      dadosAtualizacao.data_autuacao = input.dataAutuacao;
    }
    if (input.segredoJustica !== undefined) {
      dadosAtualizacao.segredo_justica = input.segredoJustica;
    }
    if (input.juizoDigital !== undefined) {
      dadosAtualizacao.juizo_digital = input.juizoDigital;
    }
    if (input.temAssociacao !== undefined) {
      dadosAtualizacao.tem_associacao = input.temAssociacao;
    }
    if (input.prioridadeProcessual !== undefined) {
      dadosAtualizacao.prioridade_processual = input.prioridadeProcessual;
    }
    if (input.qtdeParteAutora !== undefined) {
      dadosAtualizacao.qtde_parte_autora = input.qtdeParteAutora;
    }
    if (input.qtdeParteRe !== undefined) {
      dadosAtualizacao.qtde_parte_re = input.qtdeParteRe;
    }
    if (input.dataArquivamento !== undefined) {
      dadosAtualizacao.data_arquivamento = input.dataArquivamento;
    }
    if (input.dataProximaAudiencia !== undefined) {
      dadosAtualizacao.data_proxima_audiencia = input.dataProximaAudiencia;
    }
    if (input.responsavelId !== undefined) {
      dadosAtualizacao.responsavel_id = input.responsavelId;
    }

    // Preservar estado anterior para auditoria (se coluna existir)
    // dadosAtualizacao.dados_anteriores = {
    //   ...processoExistente,
    //   updated_at_previous: processoExistente.updatedAt,
    // };

    const { data, error } = await db
      .from(TABLE_ACERVO)
      .update(dadosAtualizacao)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return err(
        appError('DATABASE_ERROR', `Erro ao atualizar processo: ${error.message}`, {
          code: error.code,
        })
      );
    }

    return ok(converterParaProcesso(data as Record<string, unknown>));
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao atualizar processo',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}
