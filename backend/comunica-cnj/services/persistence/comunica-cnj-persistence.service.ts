/**
 * Serviço de persistência para comunicações CNJ
 * Operações CRUD na tabela comunica_cnj
 * 
 * ⚠️ SERVIÇO LEGADO - DEPRECATED ⚠️
 * 
 * Este serviço está sendo substituído por `src/core/comunica-cnj/repository.ts`.
 * 
 * **MIGRE PARA:**
 * - Funções do repositório em `@/core/comunica-cnj/repository`
 * - Use serviços de orquestração em `@/core/comunica-cnj/service` quando possível
 * 
 * @deprecated Use `src/core/comunica-cnj` para novas integrações
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type { ComunicaCNJ, InserirComunicaCNJParams } from '../../types/types';

// =============================================================================
// INSERÇÃO
// =============================================================================

/**
 * Insere uma nova comunicação CNJ no banco de dados
 * Ignora se já existir (by hash)
 *
 * @param params - Dados da comunicação
 * @returns Comunicação inserida ou null se já existia
 */
export async function inserirComunicacao(
  params: InserirComunicaCNJParams
): Promise<ComunicaCNJ | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('comunica_cnj')
    .insert({
      id_cnj: params.id_cnj,
      hash: params.hash,
      numero_comunicacao: params.numero_comunicacao ?? null,
      numero_processo: params.numero_processo,
      numero_processo_mascara: params.numero_processo_mascara ?? null,
      sigla_tribunal: params.sigla_tribunal,
      orgao_id: params.orgao_id ?? null,
      nome_orgao: params.nome_orgao ?? null,
      tipo_comunicacao: params.tipo_comunicacao ?? null,
      tipo_documento: params.tipo_documento ?? null,
      nome_classe: params.nome_classe ?? null,
      codigo_classe: params.codigo_classe ?? null,
      meio: params.meio,
      meio_completo: params.meio_completo ?? null,
      texto: params.texto ?? null,
      link: params.link ?? null,
      data_disponibilizacao: params.data_disponibilizacao,
      ativo: params.ativo ?? true,
      status: params.status ?? null,
      motivo_cancelamento: params.motivo_cancelamento ?? null,
      data_cancelamento: params.data_cancelamento ?? null,
      destinatarios: params.destinatarios ?? null,
      destinatarios_advogados: params.destinatarios_advogados ?? null,
      expediente_id: params.expediente_id ?? null,
      advogado_id: params.advogado_id ?? null,
      metadados: params.metadados ?? null,
    })
    .select()
    .single();

  if (error) {
    // Ignora erro de duplicidade (hash já existe)
    if (error.code === '23505') {
      console.log(
        '[comunica-cnj-persistence] Comunicação já existe (hash):',
        params.hash
      );
      return null;
    }
    throw new Error(`Erro ao inserir comunicação: ${error.message}`);
  }

  return data as ComunicaCNJ;
}

/**
 * Insere múltiplas comunicações CNJ (batch)
 * Ignora duplicadas
 *
 * @param comunicacoes - Array de comunicações
 * @returns Estatísticas de inserção
 */
export async function inserirComunicacoesBatch(
  comunicacoes: InserirComunicaCNJParams[]
): Promise<{ inseridas: number; duplicadas: number; erros: number }> {
  let inseridas = 0;
  let duplicadas = 0;
  let erros = 0;

  for (const comunicacao of comunicacoes) {
    try {
      const result = await inserirComunicacao(comunicacao);
      if (result) {
        inseridas++;
      } else {
        duplicadas++;
      }
    } catch (error) {
      console.error(
        '[comunica-cnj-persistence] Erro ao inserir comunicação:',
        error
      );
      erros++;
    }
  }

  return { inseridas, duplicadas, erros };
}

// =============================================================================
// CONSULTA
// =============================================================================

/**
 * Busca comunicação por hash
 *
 * @param hash - Hash único da comunicação
 * @returns Comunicação ou null se não encontrada
 */
export async function buscarPorHash(hash: string): Promise<ComunicaCNJ | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('comunica_cnj')
    .select('*')
    .eq('hash', hash)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw new Error(`Erro ao buscar comunicação: ${error.message}`);
  }

  return data as ComunicaCNJ;
}

/**
 * Busca comunicação por ID do CNJ
 *
 * @param idCnj - ID da comunicação na API do CNJ
 * @returns Comunicação ou null se não encontrada
 */
export async function buscarPorIdCnj(
  idCnj: number
): Promise<ComunicaCNJ | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('comunica_cnj')
    .select('*')
    .eq('id_cnj', idCnj)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar comunicação: ${error.message}`);
  }

  return data as ComunicaCNJ;
}

/**
 * Verifica se comunicação já existe (by hash)
 *
 * @param hash - Hash da comunicação
 * @returns true se existe
 */
export async function existeComunicacao(hash: string): Promise<boolean> {
  const supabase = createServiceClient();

  const { count, error } = await supabase
    .from('comunica_cnj')
    .select('*', { count: 'exact', head: true })
    .eq('hash', hash);

  if (error) {
    throw new Error(`Erro ao verificar comunicação: ${error.message}`);
  }

  return (count ?? 0) > 0;
}

/**
 * Lista comunicações com filtros
 *
 * @param filtros - Filtros de busca
 * @returns Lista de comunicações
 */
export async function listarComunicacoes(filtros: {
  numeroProcesso?: string;
  siglaTribunal?: string;
  dataInicio?: string;
  dataFim?: string;
  advogadoId?: number;
  expedienteId?: number;
  semExpediente?: boolean;
  pagina?: number;
  itensPorPagina?: number;
}): Promise<{ data: ComunicaCNJ[]; total: number }> {
  const supabase = createServiceClient();

  const pagina = filtros.pagina ?? 1;
  const itensPorPagina = filtros.itensPorPagina ?? 50;
  const offset = (pagina - 1) * itensPorPagina;

  let query = supabase.from('comunica_cnj').select('*', { count: 'exact' });

  if (filtros.numeroProcesso) {
    query = query.eq('numero_processo', filtros.numeroProcesso);
  }

  if (filtros.siglaTribunal) {
    query = query.eq('sigla_tribunal', filtros.siglaTribunal);
  }

  if (filtros.dataInicio) {
    query = query.gte('data_disponibilizacao', filtros.dataInicio);
  }

  if (filtros.dataFim) {
    query = query.lte('data_disponibilizacao', filtros.dataFim);
  }

  if (filtros.advogadoId) {
    query = query.eq('advogado_id', filtros.advogadoId);
  }

  if (filtros.expedienteId) {
    query = query.eq('expediente_id', filtros.expedienteId);
  }

  if (filtros.semExpediente) {
    query = query.is('expediente_id', null);
  }

  const { data, error, count } = await query
    .order('data_disponibilizacao', { ascending: false })
    .range(offset, offset + itensPorPagina - 1);

  if (error) {
    throw new Error(`Erro ao listar comunicações: ${error.message}`);
  }

  return {
    data: (data as ComunicaCNJ[]) ?? [],
    total: count ?? 0,
  };
}

// =============================================================================
// ATUALIZAÇÃO
// =============================================================================

/**
 * Vincula comunicação a um expediente
 *
 * @param comunicacaoId - ID da comunicação
 * @param expedienteId - ID do expediente
 * @returns Comunicação atualizada
 */
export async function vincularExpediente(
  comunicacaoId: number,
  expedienteId: number
): Promise<ComunicaCNJ> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('comunica_cnj')
    .update({ expediente_id: expedienteId })
    .eq('id', comunicacaoId)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao vincular expediente: ${error.message}`);
  }

  return data as ComunicaCNJ;
}

/**
 * Desvincula comunicação de expediente
 *
 * @param comunicacaoId - ID da comunicação
 * @returns Comunicação atualizada
 */
export async function desvincularExpediente(
  comunicacaoId: number
): Promise<ComunicaCNJ> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('comunica_cnj')
    .update({ expediente_id: null })
    .eq('id', comunicacaoId)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao desvincular expediente: ${error.message}`);
  }

  return data as ComunicaCNJ;
}

/**
 * Atualiza advogado responsável pela captura
 *
 * @param comunicacaoId - ID da comunicação
 * @param advogadoId - ID do advogado
 * @returns Comunicação atualizada
 */
export async function atualizarAdvogado(
  comunicacaoId: number,
  advogadoId: number
): Promise<ComunicaCNJ> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('comunica_cnj')
    .update({ advogado_id: advogadoId })
    .eq('id', comunicacaoId)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar advogado: ${error.message}`);
  }

  return data as ComunicaCNJ;
}

// =============================================================================
// BUSCA DE EXPEDIENTE CORRESPONDENTE
// =============================================================================

/**
 * Busca expediente correspondente à comunicação
 * Critérios: numero_processo + trt + grau + data_criacao (janela de 3 dias)
 *
 * @param numeroProcesso - Número do processo (sem máscara)
 * @param trt - Sigla do TRT
 * @param grau - Grau do tribunal
 * @param dataDisponibilizacao - Data de disponibilização da comunicação
 * @returns ID do expediente ou null se não encontrar
 */
export async function buscarExpedienteCorrespondente(
  numeroProcesso: string,
  trt: string,
  grau: string,
  dataDisponibilizacao: string
): Promise<number | null> {
  const supabase = createServiceClient();

  // Calcula data limite (3 dias antes)
  const dataDisp = new Date(dataDisponibilizacao);
  const dataLimite = new Date(dataDisp);
  dataLimite.setDate(dataLimite.getDate() - 3);

  const { data, error } = await supabase
    .from('expedientes')
    .select('id')
    .eq('numero_processo', numeroProcesso)
    .eq('trt', trt)
    .eq('grau', grau)
    .gte('data_criacao_expediente', dataLimite.toISOString().split('T')[0])
    .lte('data_criacao_expediente', dataDisponibilizacao)
    .is('baixado_em', null) // Não baixado
    .order('data_criacao_expediente', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    // Verifica se já existe comunicação vinculada
    console.log(
      '[comunica-cnj-persistence] Erro ao buscar expediente:',
      error.message
    );
    return null;
  }

  // Verifica se o expediente já tem comunicação vinculada
  const { count } = await supabase
    .from('comunica_cnj')
    .select('*', { count: 'exact', head: true })
    .eq('expediente_id', data.id);

  if (count && count > 0) {
    console.log(
      '[comunica-cnj-persistence] Expediente já tem comunicação vinculada:',
      data.id
    );
    return null;
  }

  return data.id;
}
