/**
 * CONTRATOS FEATURE - Camada de Persistência
 *
 * Este arquivo contém funções de acesso ao banco de dados para Contratos.
 *
 * CONVENÇÕES:
 * - Funções assíncronas que retornam Result<T>
 * - Nomes descritivos: findById, findAll, save, update
 * - NUNCA fazer validação de negócio aqui (apenas persistência)
 */

import { createDbClient } from '@/lib/supabase';
import { Result, ok, err, appError, PaginatedResponse } from '@/lib/types';
import type {
  Contrato,
  CreateContratoInput,
  UpdateContratoInput,
  ListarContratosParams,
  ParteContrato,
  SegmentoTipo,
  TipoContrato,
  TipoCobranca,
  StatusContrato,
  PoloProcessual,
} from './domain';

// =============================================================================
// CONSTANTES
// =============================================================================

const TABLE_CONTRATOS = 'contratos';
const TABLE_CLIENTES = 'clientes';
const TABLE_PARTES_CONTRARIAS = 'partes_contrarias';

// =============================================================================
// CONVERSORES
// =============================================================================

/**
 * Converte dados do banco (snake_case) para entidade Contrato (camelCase)
 */
function converterParaContrato(data: Record<string, unknown>): Contrato {
  return {
    id: data.id as number,
    segmentoId: (data.segmento_id as number | null) ?? null,
    tipoContrato: data.tipo_contrato as TipoContrato,
    tipoCobranca: data.tipo_cobranca as TipoCobranca,
    clienteId: data.cliente_id as number,
    poloCliente: data.polo_cliente as PoloProcessual,
    parteContrariaId: (data.parte_contraria_id as number | null) ?? null,
    parteAutora: (data.parte_autora as ParteContrato[] | null) ?? null,
    parteRe: (data.parte_re as ParteContrato[] | null) ?? null,
    qtdeParteAutora: (data.qtde_parte_autora as number) ?? 1,
    qtdeParteRe: (data.qtde_parte_re as number) ?? 1,
    status: data.status as StatusContrato,
    dataContratacao: data.data_contratacao as string,
    dataAssinatura: (data.data_assinatura as string | null) ?? null,
    dataDistribuicao: (data.data_distribuicao as string | null) ?? null,
    dataDesistencia: (data.data_desistencia as string | null) ?? null,
    responsavelId: (data.responsavel_id as number | null) ?? null,
    createdBy: (data.created_by as number | null) ?? null,
    observacoes: (data.observacoes as string | null) ?? null,
    dadosAnteriores: (data.dados_anteriores as Record<string, unknown> | null) ?? null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

/**
 * Converte data ISO string para formato date (YYYY-MM-DD) ou null
 */
function parseDate(dateString: string | null | undefined): string | null {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

/**
 * Tipo de entrada para validarPartes (aceita campos opcionais do Zod)
 */
type ParteInput = {
  tipo?: 'cliente' | 'parte_contraria';
  id?: number;
  nome?: string;
};

/**
 * Valida e normaliza array de partes JSONB
 */
function validarPartes(partes: ParteInput[] | ParteContrato[] | null | undefined): ParteContrato[] | null {
  if (!partes || partes.length === 0) return null;

  const partesValidas: ParteContrato[] = [];

  for (const parte of partes) {
    if (
      parte.tipo &&
      (parte.tipo === 'cliente' || parte.tipo === 'parte_contraria') &&
      parte.id &&
      parte.nome
    ) {
      partesValidas.push({
        tipo: parte.tipo,
        id: parte.id,
        nome: parte.nome.trim(),
      });
    }
  }

  return partesValidas.length > 0 ? partesValidas : null;
}

// =============================================================================
// FUNÇÕES DE LEITURA
// =============================================================================

/**
 * Busca um contrato pelo ID
 */
export async function findContratoById(id: number): Promise<Result<Contrato | null>> {
  try {
    const db = createDbClient();

    const { data, error } = await db.from(TABLE_CONTRATOS).select('*').eq('id', id).single();

    if (error) {
      if (error.code === 'PGRST116') {
        return ok(null);
      }
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(converterParaContrato(data as Record<string, unknown>));
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao buscar contrato',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Lista contratos com filtros e paginação
 */
export async function findAllContratos(
  params: ListarContratosParams = {}
): Promise<Result<PaginatedResponse<Contrato>>> {
  try {
    const db = createDbClient();

    const pagina = params.pagina ?? 1;
    const limite = params.limite ?? 50;
    const offset = (pagina - 1) * limite;

    let query = db.from(TABLE_CONTRATOS).select('*', { count: 'exact' });

    // Aplicar filtros
    if (params.busca) {
      const busca = params.busca.trim();
      query = query.ilike('observacoes', `%${busca}%`);
    }

    if (params.segmentoId) {
      query = query.eq('segmento_id', params.segmentoId);
    }

    if (params.tipoContrato) {
      query = query.eq('tipo_contrato', params.tipoContrato);
    }

    if (params.tipoCobranca) {
      query = query.eq('tipo_cobranca', params.tipoCobranca);
    }

    if (params.status) {
      query = query.eq('status', params.status);
    }

    if (params.clienteId) {
      query = query.eq('cliente_id', params.clienteId);
    }

    if (params.parteContrariaId) {
      query = query.eq('parte_contraria_id', params.parteContrariaId);
    }

    if (params.responsavelId) {
      query = query.eq('responsavel_id', params.responsavelId);
    }

    // Ordenação
    const ordenarPor = params.ordenarPor ?? 'created_at';
    const ordem = params.ordem ?? 'desc';
    if (ordenarPor === 'segmento_id' || ordenarPor === 'area_direito') {
      query = query.order(ordenarPor === 'area_direito' ? 'segmento_id' : 'segmento_id', { ascending: ordem === 'asc' });
    } else {
      query = query.order(ordenarPor, { ascending: ordem === 'asc' });
    }

    // Paginação
    query = query.range(offset, offset + limite - 1);

    const { data, error, count } = await query;

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    const contratos = (data || []).map((item) =>
      converterParaContrato(item as Record<string, unknown>)
    );
    const total = count ?? 0;
    const totalPages = Math.ceil(total / limite);

    return ok({
      data: contratos,
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
        'Erro ao listar contratos',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Verifica se um cliente existe
 */
export async function clienteExists(clienteId: number): Promise<Result<boolean>> {
  try {
    const db = createDbClient();

    const { data, error } = await db
      .from(TABLE_CLIENTES)
      .select('id')
      .eq('id', clienteId)
      .maybeSingle();

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(!!data);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao verificar cliente',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Verifica se uma parte contrária existe
 */
export async function parteContrariaExists(parteContrariaId: number): Promise<Result<boolean>> {
  try {
    const db = createDbClient();

    const { data, error } = await db
      .from(TABLE_PARTES_CONTRARIAS)
      .select('id')
      .eq('id', parteContrariaId)
      .maybeSingle();

    if (error) {
      return err(appError('DATABASE_ERROR', error.message, { code: error.code }));
    }

    return ok(!!data);
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao verificar parte contrária',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

// =============================================================================
// FUNÇÕES DE ESCRITA
// =============================================================================

/**
 * Cria um novo contrato no banco
 */
export async function saveContrato(input: CreateContratoInput): Promise<Result<Contrato>> {
  try {
    const db = createDbClient();

    // Validar partes JSONB
    const parteAutoraValidada = validarPartes(input.parteAutora);
    const parteReValidada = validarPartes(input.parteRe);

    // Calcular quantidades
    const qtdeParteAutora = parteAutoraValidada?.length ?? input.qtdeParteAutora ?? 1;
    const qtdeParteRe = parteReValidada?.length ?? input.qtdeParteRe ?? 1;

    // Preparar dados para inserção (snake_case)
    const dadosInsercao: Record<string, unknown> = {
      tipo_contrato: input.tipoContrato,
      tipo_cobranca: input.tipoCobranca,
      cliente_id: input.clienteId,
      polo_cliente: input.poloCliente,
      parte_contraria_id: input.parteContrariaId ?? null,
      parte_autora: parteAutoraValidada,
      parte_re: parteReValidada,
      qtde_parte_autora: qtdeParteAutora,
      qtde_parte_re: qtdeParteRe,
      status: input.status ?? 'em_contratacao',
      data_contratacao: input.dataContratacao
        ? parseDate(input.dataContratacao)
        : new Date().toISOString().split('T')[0],
      data_assinatura: parseDate(input.dataAssinatura),
      data_distribuicao: parseDate(input.dataDistribuicao),
      data_desistencia: parseDate(input.dataDesistencia),
      responsavel_id: input.responsavelId ?? null,
      created_by: input.createdBy ?? null,
      observacoes: input.observacoes?.trim() ?? null,
    };

    if (input.segmentoId) {
      dadosInsercao.segmento_id = input.segmentoId;
    }

    const { data, error } = await db
      .from(TABLE_CONTRATOS)
      .insert(dadosInsercao)
      .select()
      .single();

    if (error) {
      return err(appError('DATABASE_ERROR', `Erro ao criar contrato: ${error.message}`, { code: error.code }));
    }

    return ok(converterParaContrato(data as Record<string, unknown>));
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao criar contrato',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Atualiza um contrato existente
 */
export async function updateContrato(
  id: number,
  input: UpdateContratoInput,
  contratoExistente: Contrato
): Promise<Result<Contrato>> {
  try {
    const db = createDbClient();

    // Preparar dados para atualização (snake_case)
    const dadosAtualizacao: Record<string, unknown> = {};

    if (input.segmentoId !== undefined) {
      dadosAtualizacao.segmento_id = input.segmentoId;
    }
    if (input.tipoContrato !== undefined) {
      dadosAtualizacao.tipo_contrato = input.tipoContrato;
    }
    if (input.tipoCobranca !== undefined) {
      dadosAtualizacao.tipo_cobranca = input.tipoCobranca;
    }
    if (input.clienteId !== undefined) {
      dadosAtualizacao.cliente_id = input.clienteId;
    }
    if (input.poloCliente !== undefined) {
      dadosAtualizacao.polo_cliente = input.poloCliente;
    }
    if (input.parteContrariaId !== undefined) {
      dadosAtualizacao.parte_contraria_id = input.parteContrariaId;
    }
    if (input.parteAutora !== undefined) {
      const parteAutoraValidada = validarPartes(input.parteAutora);
      dadosAtualizacao.parte_autora = parteAutoraValidada;
      if (input.qtdeParteAutora === undefined && parteAutoraValidada) {
        dadosAtualizacao.qtde_parte_autora = parteAutoraValidada.length;
      }
    }
    if (input.parteRe !== undefined) {
      const parteReValidada = validarPartes(input.parteRe);
      dadosAtualizacao.parte_re = parteReValidada;
      if (input.qtdeParteRe === undefined && parteReValidada) {
        dadosAtualizacao.qtde_parte_re = parteReValidada.length;
      }
    }
    if (input.qtdeParteAutora !== undefined) {
      dadosAtualizacao.qtde_parte_autora = input.qtdeParteAutora;
    }
    if (input.qtdeParteRe !== undefined) {
      dadosAtualizacao.qtde_parte_re = input.qtdeParteRe;
    }
    if (input.status !== undefined) {
      dadosAtualizacao.status = input.status;
    }
    if (input.dataContratacao !== undefined) {
      dadosAtualizacao.data_contratacao = input.dataContratacao
        ? parseDate(input.dataContratacao)
        : new Date().toISOString().split('T')[0];
    }
    if (input.dataAssinatura !== undefined) {
      dadosAtualizacao.data_assinatura = parseDate(input.dataAssinatura);
    }
    if (input.dataDistribuicao !== undefined) {
      dadosAtualizacao.data_distribuicao = parseDate(input.dataDistribuicao);
    }
    if (input.dataDesistencia !== undefined) {
      dadosAtualizacao.data_desistencia = parseDate(input.dataDesistencia);
    }
    if (input.responsavelId !== undefined) {
      dadosAtualizacao.responsavel_id = input.responsavelId;
    }
    if (input.observacoes !== undefined) {
      dadosAtualizacao.observacoes = input.observacoes?.trim() ?? null;
    }

    // Preservar apenas campos críticos no snapshot de auditoria
    // Evita crescimento recursivo de dados_anteriores
    dadosAtualizacao.dados_anteriores = {
      id: contratoExistente.id,
      status: contratoExistente.status,
      clienteId: contratoExistente.clienteId,
      segmentoId: contratoExistente.segmentoId,
      tipoContrato: contratoExistente.tipoContrato,
      dataContratacao: contratoExistente.dataContratacao,
      responsavelId: contratoExistente.responsavelId,
      updated_at_previous: contratoExistente.updatedAt,
    };

    const { data, error } = await db
      .from(TABLE_CONTRATOS)
      .update(dadosAtualizacao)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return err(appError('DATABASE_ERROR', `Erro ao atualizar contrato: ${error.message}`, { code: error.code }));
    }

    return ok(converterParaContrato(data as Record<string, unknown>));
  } catch (error) {
    return err(
      appError(
        'DATABASE_ERROR',
        'Erro ao atualizar contrato',
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}
