// Serviço de persistência de contratos
// Gerencia operações de CRUD na tabela contratos

import { createServiceClient } from '@/backend/utils/supabase/service-client';

/**
 * Área de direito
 */
export type AreaDireito = 'trabalhista' | 'civil' | 'previdenciario' | 'criminal' | 'empresarial' | 'administrativo';

/**
 * Tipo de contrato
 */
export type TipoContrato = 'ajuizamento' | 'defesa' | 'ato_processual' | 'assessoria' | 'consultoria' | 'extrajudicial' | 'parecer';

/**
 * Tipo de cobrança
 */
export type TipoCobranca = 'pro_exito' | 'pro_labore';

/**
 * Status do contrato
 */
export type StatusContrato = 'em_contratacao' | 'contratado' | 'distribuido' | 'desistencia';

/**
 * Polo processual
 */
export type PoloProcessual = 'autor' | 're';

/**
 * Estrutura de uma parte no JSONB
 */
export interface ParteContrato {
  tipo: 'cliente' | 'parte_contraria';
  id: number;
  nome: string;
}

/**
 * Dados para cadastro/atualização de contrato
 */
export interface ContratoDados {
  areaDireito: AreaDireito;
  tipoContrato: TipoContrato;
  tipoCobranca: TipoCobranca;
  clienteId: number;
  poloCliente: PoloProcessual;
  parteContrariaId?: number;
  parteAutora?: ParteContrato[];
  parteRe?: ParteContrato[];
  qtdeParteAutora?: number;
  qtdeParteRe?: number;
  status?: StatusContrato;
  dataContratacao?: string; // ISO date string
  dataAssinatura?: string; // ISO date string (YYYY-MM-DD)
  dataDistribuicao?: string; // ISO date string (YYYY-MM-DD)
  dataDesistencia?: string; // ISO date string (YYYY-MM-DD)
  responsavelId?: number;
  createdBy?: number;
  observacoes?: string;
}

/**
 * Dados retornados do banco
 */
export interface Contrato {
  id: number;
  areaDireito: AreaDireito;
  tipoContrato: TipoContrato;
  tipoCobranca: TipoCobranca;
  clienteId: number;
  poloCliente: PoloProcessual;
  parteContrariaId: number | null;
  parteAutora: ParteContrato[] | null;
  parteRe: ParteContrato[] | null;
  qtdeParteAutora: number;
  qtdeParteRe: number;
  status: StatusContrato;
  dataContratacao: string;
  dataAssinatura: string | null;
  dataDistribuicao: string | null;
  dataDesistencia: string | null;
  responsavelId: number | null;
  createdBy: number | null;
  observacoes: string | null;
  dadosAnteriores: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Resultado de operação
 */
export interface OperacaoContratoResult {
  sucesso: boolean;
  contrato?: Contrato;
  erro?: string;
}

/**
 * Parâmetros para listar contratos
 */
export interface ListarContratosParams {
  pagina?: number;
  limite?: number;
  busca?: string; // Busca em observacoes
  areaDireito?: AreaDireito;
  tipoContrato?: TipoContrato;
  status?: StatusContrato;
  clienteId?: number;
  parteContrariaId?: number;
  responsavelId?: number;
}

/**
 * Resultado da listagem
 */
export interface ListarContratosResult {
  contratos: Contrato[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

/**
 * Converte data ISO string para date ou null
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
 * Valida array de partes JSONB
 */
function validarPartes(partes: ParteContrato[] | undefined): ParteContrato[] | null {
  if (!partes || partes.length === 0) return null;
  
  const partesValidas: ParteContrato[] = [];
  
  for (const parte of partes) {
    if (parte.tipo && (parte.tipo === 'cliente' || parte.tipo === 'parte_contraria') && parte.id && parte.nome) {
      partesValidas.push({
        tipo: parte.tipo,
        id: parte.id,
        nome: parte.nome.trim(),
      });
    }
  }
  
  return partesValidas.length > 0 ? partesValidas : null;
}

/**
 * Converte dados do banco para formato de retorno
 */
function converterParaContrato(data: Record<string, unknown>): Contrato {
  return {
    id: data.id as number,
    areaDireito: data.area_direito as AreaDireito,
    tipoContrato: data.tipo_contrato as TipoContrato,
    tipoCobranca: data.tipo_cobranca as TipoCobranca,
    clienteId: data.cliente_id as number,
    poloCliente: data.polo_cliente as PoloProcessual,
    parteContrariaId: (data.parte_contraria_id as number | null) ?? null,
    parteAutora: (data.parte_autora as ParteContrato[] | null) ?? null,
    parteRe: (data.parte_re as ParteContrato[] | null) ?? null,
    qtdeParteAutora: data.qtde_parte_autora as number,
    qtdeParteRe: data.qtde_parte_re as number,
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
 * Cria um novo contrato no sistema
 */
export async function criarContrato(
  params: ContratoDados
): Promise<OperacaoContratoResult> {
  const supabase = createServiceClient();

  try {
    // Validações obrigatórias
    if (!params.areaDireito) {
      return { sucesso: false, erro: 'Área de direito é obrigatória' };
    }

    if (!params.tipoContrato) {
      return { sucesso: false, erro: 'Tipo de contrato é obrigatório' };
    }

    if (!params.tipoCobranca) {
      return { sucesso: false, erro: 'Tipo de cobrança é obrigatório' };
    }

    if (!params.clienteId) {
      return { sucesso: false, erro: 'Cliente é obrigatório' };
    }

    if (!params.poloCliente) {
      return { sucesso: false, erro: 'Polo do cliente é obrigatório' };
    }

    // Verificar se cliente existe
    const { data: cliente, error: erroCliente } = await supabase
      .from('clientes')
      .select('id')
      .eq('id', params.clienteId)
      .single();

    if (erroCliente || !cliente) {
      return { sucesso: false, erro: 'Cliente não encontrado' };
    }

    // Verificar se parte contrária existe (se fornecida)
    if (params.parteContrariaId) {
      const { data: parteContraria, error: erroParte } = await supabase
        .from('partes_contrarias')
        .select('id')
        .eq('id', params.parteContrariaId)
        .single();

      if (erroParte || !parteContraria) {
        return { sucesso: false, erro: 'Parte contrária não encontrada' };
      }
    }

    // Validar partes JSONB
    const parteAutoraValidada = validarPartes(params.parteAutora);
    const parteReValidada = validarPartes(params.parteRe);

    // Calcular quantidades
    const qtdeParteAutora = parteAutoraValidada?.length ?? params.qtdeParteAutora ?? 1;
    const qtdeParteRe = parteReValidada?.length ?? params.qtdeParteRe ?? 1;

    // Preparar dados para inserção
    const dadosNovos: Record<string, unknown> = {
      area_direito: params.areaDireito,
      tipo_contrato: params.tipoContrato,
      tipo_cobranca: params.tipoCobranca,
      cliente_id: params.clienteId,
      polo_cliente: params.poloCliente,
      parte_contraria_id: params.parteContrariaId || null,
      parte_autora: parteAutoraValidada,
      parte_re: parteReValidada,
      qtde_parte_autora: qtdeParteAutora,
      qtde_parte_re: qtdeParteRe,
      status: params.status || 'em_contratacao',
      data_contratacao: params.dataContratacao ? new Date(params.dataContratacao).toISOString() : new Date().toISOString(),
      data_assinatura: parseDate(params.dataAssinatura),
      data_distribuicao: parseDate(params.dataDistribuicao),
      data_desistencia: parseDate(params.dataDesistencia),
      responsavel_id: params.responsavelId || null,
      created_by: params.createdBy || null,
      observacoes: params.observacoes?.trim() || null,
    };

    const { data, error } = await supabase
      .from('contratos')
      .insert(dadosNovos)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar contrato:', error);
      return { sucesso: false, erro: `Erro ao criar contrato: ${error.message}` };
    }

    return {
      sucesso: true,
      contrato: converterParaContrato(data),
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao criar contrato:', error);
    return { sucesso: false, erro: `Erro inesperado: ${erroMsg}` };
  }
}

/**
 * Atualiza um contrato existente
 */
export async function atualizarContrato(
  id: number,
  params: Partial<ContratoDados>
): Promise<OperacaoContratoResult> {
  const supabase = createServiceClient();

  try {
    // Verificar se contrato existe
    const { data: contratoExistente, error: erroBusca } = await supabase
      .from('contratos')
      .select('id')
      .eq('id', id)
      .single();

    if (erroBusca || !contratoExistente) {
      return { sucesso: false, erro: 'Contrato não encontrado' };
    }

    // Verificar se cliente existe (se fornecido)
    if (params.clienteId) {
      const { data: cliente, error: erroCliente } = await supabase
        .from('clientes')
        .select('id')
        .eq('id', params.clienteId)
        .single();

      if (erroCliente || !cliente) {
        return { sucesso: false, erro: 'Cliente não encontrado' };
      }
    }

    // Verificar se parte contrária existe (se fornecida)
    if (params.parteContrariaId !== undefined && params.parteContrariaId !== null) {
      const { data: parteContraria, error: erroParte } = await supabase
        .from('partes_contrarias')
        .select('id')
        .eq('id', params.parteContrariaId)
        .single();

      if (erroParte || !parteContraria) {
        return { sucesso: false, erro: 'Parte contrária não encontrada' };
      }
    }

    // Preparar dados para atualização
    const dadosAtualizacao: Record<string, unknown> = {};

    if (params.areaDireito !== undefined) {
      dadosAtualizacao.area_direito = params.areaDireito;
    }
    if (params.tipoContrato !== undefined) {
      dadosAtualizacao.tipo_contrato = params.tipoContrato;
    }
    if (params.tipoCobranca !== undefined) {
      dadosAtualizacao.tipo_cobranca = params.tipoCobranca;
    }
    if (params.clienteId !== undefined) {
      dadosAtualizacao.cliente_id = params.clienteId;
    }
    if (params.poloCliente !== undefined) {
      dadosAtualizacao.polo_cliente = params.poloCliente;
    }
    if (params.parteContrariaId !== undefined) {
      dadosAtualizacao.parte_contraria_id = params.parteContrariaId || null;
    }
    if (params.parteAutora !== undefined) {
      dadosAtualizacao.parte_autora = validarPartes(params.parteAutora);
      if (params.qtdeParteAutora === undefined && params.parteAutora) {
        dadosAtualizacao.qtde_parte_autora = params.parteAutora.length;
      }
    }
    if (params.parteRe !== undefined) {
      dadosAtualizacao.parte_re = validarPartes(params.parteRe);
      if (params.qtdeParteRe === undefined && params.parteRe) {
        dadosAtualizacao.qtde_parte_re = params.parteRe.length;
      }
    }
    if (params.qtdeParteAutora !== undefined) {
      dadosAtualizacao.qtde_parte_autora = params.qtdeParteAutora;
    }
    if (params.qtdeParteRe !== undefined) {
      dadosAtualizacao.qtde_parte_re = params.qtdeParteRe;
    }
    if (params.status !== undefined) {
      dadosAtualizacao.status = params.status;
    }
    if (params.dataContratacao !== undefined) {
      dadosAtualizacao.data_contratacao = params.dataContratacao ? new Date(params.dataContratacao).toISOString() : new Date().toISOString();
    }
    if (params.dataAssinatura !== undefined) {
      dadosAtualizacao.data_assinatura = parseDate(params.dataAssinatura);
    }
    if (params.dataDistribuicao !== undefined) {
      dadosAtualizacao.data_distribuicao = parseDate(params.dataDistribuicao);
    }
    if (params.dataDesistencia !== undefined) {
      dadosAtualizacao.data_desistencia = parseDate(params.dataDesistencia);
    }
    if (params.responsavelId !== undefined) {
      dadosAtualizacao.responsavel_id = params.responsavelId || null;
    }
    if (params.createdBy !== undefined) {
      dadosAtualizacao.created_by = params.createdBy || null;
    }
    if (params.observacoes !== undefined) {
      dadosAtualizacao.observacoes = params.observacoes?.trim() || null;
    }

    const { data, error } = await supabase
      .from('contratos')
      .update(dadosAtualizacao)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar contrato:', error);
      return { sucesso: false, erro: `Erro ao atualizar contrato: ${error.message}` };
    }

    return {
      sucesso: true,
      contrato: converterParaContrato(data),
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao atualizar contrato:', error);
    return { sucesso: false, erro: `Erro inesperado: ${erroMsg}` };
  }
}

/**
 * Busca um contrato por ID
 */
export async function buscarContratoPorId(id: number): Promise<Contrato | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('contratos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar contrato: ${error.message}`);
  }

  return data ? converterParaContrato(data) : null;
}

/**
 * Lista contratos com filtros e paginação
 */
export async function listarContratos(
  params: ListarContratosParams = {}
): Promise<ListarContratosResult> {
  const supabase = createServiceClient();

  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 50;
  const offset = (pagina - 1) * limite;

  let query = supabase.from('contratos').select('*', { count: 'exact' });

  if (params.busca) {
    const busca = params.busca.trim();
    query = query.ilike('observacoes', `%${busca}%`);
  }

  if (params.areaDireito) {
    query = query.eq('area_direito', params.areaDireito);
  }

  if (params.tipoContrato) {
    query = query.eq('tipo_contrato', params.tipoContrato);
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

  query = query.order('created_at', { ascending: false }).range(offset, offset + limite - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar contratos: ${error.message}`);
  }

  const contratos = (data || []).map(converterParaContrato);
  const total = count ?? 0;
  const totalPaginas = Math.ceil(total / limite);

  return {
    contratos,
    total,
    pagina,
    limite,
    totalPaginas,
  };
}

