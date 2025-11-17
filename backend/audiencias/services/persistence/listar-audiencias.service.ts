// Serviço de persistência para listar audiências
// Gerencia consultas na tabela audiencias com filtros, paginação e ordenação

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type {
  Audiencia,
  ListarAudienciasParams,
  ListarAudienciasResult,
} from '@/backend/types/audiencias/types';

/**
 * Converte dados do banco para formato de retorno
 */
function converterParaAudiencia(data: Record<string, unknown>): Audiencia {
  return {
    id: data.id as number,
    id_pje: data.id_pje as number,
    advogado_id: data.advogado_id as number,
    processo_id: data.processo_id as number,
    orgao_julgador_id: (data.orgao_julgador_id as number | null) ?? null,
    trt: data.trt as string,
    grau: data.grau as 'primeiro_grau' | 'segundo_grau',
    numero_processo: data.numero_processo as string,
    data_inicio: data.data_inicio as string,
    data_fim: data.data_fim as string,
    sala_audiencia_nome: (data.sala_audiencia_nome as string | null) ?? null,
    sala_audiencia_id: (data.sala_audiencia_id as number | null) ?? null,
    status: data.status as string,
    status_descricao: (data.status_descricao as string | null) ?? null,
    tipo_id: (data.tipo_id as number | null) ?? null,
    tipo_descricao: (data.tipo_descricao as string | null) ?? null,
    tipo_codigo: (data.tipo_codigo as string | null) ?? null,
    tipo_is_virtual: (data.tipo_is_virtual as boolean) ?? false,
    designada: (data.designada as boolean) ?? false,
    em_andamento: (data.em_andamento as boolean) ?? false,
    documento_ativo: (data.documento_ativo as boolean) ?? false,
    polo_ativo_nome: (data.polo_ativo_nome as string | null) ?? null,
    polo_ativo_cpf: (data.polo_ativo_cpf as string | null) ?? null,
    polo_passivo_nome: (data.polo_passivo_nome as string | null) ?? null,
    polo_passivo_cnpj: (data.polo_passivo_cnpj as string | null) ?? null,
    url_audiencia_virtual: (data.url_audiencia_virtual as string | null) ?? null,
    hora_inicial: (data.hora_inicial as string | null) ?? null,
    hora_final: (data.hora_final as string | null) ?? null,
    responsavel_id: (data.responsavel_id as number | null) ?? null, // Vem do join com acervo
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}

/**
 * Lista audiências com filtros, paginação e ordenação
 * Faz join com acervo para obter responsavel_id
 */
export async function listarAudiencias(
  params: ListarAudienciasParams = {}
): Promise<ListarAudienciasResult> {
  const supabase = createServiceClient();

  const pagina = params.pagina ?? 1;
  const limite = Math.min(params.limite ?? 50, 100); // Máximo 100
  const offset = (pagina - 1) * limite;

  // Fazer join com acervo para pegar responsavel_id
  // Usar sintaxe do Supabase para relacionamentos via foreign key processo_id
  // O Supabase detecta automaticamente o relacionamento pela foreign key
  let query = supabase
    .from('audiencias')
    .select('*, acervo!inner(responsavel_id)', { count: 'exact' });

  // Filtros básicos (campos da tabela audiencias não precisam de prefixo)
  if (params.trt) {
    query = query.eq('trt', params.trt);
  }

  if (params.grau) {
    query = query.eq('grau', params.grau);
  }

  // Filtro de responsável (vem do join com acervo)
  if (params.sem_responsavel === true) {
    query = query.is('acervo.responsavel_id', null);
  } else if (params.responsavel_id !== undefined) {
    if (params.responsavel_id === 'null') {
      query = query.is('acervo.responsavel_id', null);
    } else if (typeof params.responsavel_id === 'number') {
      query = query.eq('acervo.responsavel_id', params.responsavel_id);
    }
  }

  // Busca textual (busca em múltiplos campos)
  if (params.busca) {
    const busca = params.busca.trim();
    query = query.or(
      `numero_processo.ilike.%${busca}%,polo_ativo_nome.ilike.%${busca}%,polo_passivo_nome.ilike.%${busca}%`
    );
  }

  // Filtros específicos por campo
  if (params.numero_processo) {
    query = query.ilike('numero_processo', `%${params.numero_processo}%`);
  }

  if (params.polo_ativo_nome) {
    query = query.ilike('polo_ativo_nome', `%${params.polo_ativo_nome}%`);
  }

  if (params.polo_passivo_nome) {
    query = query.ilike('polo_passivo_nome', `%${params.polo_passivo_nome}%`);
  }

  if (params.status) {
    query = query.eq('status', params.status);
  }

  if (params.tipo_descricao) {
    query = query.ilike('tipo_descricao', `%${params.tipo_descricao}%`);
  }

  if (params.tipo_codigo) {
    query = query.eq('tipo_codigo', params.tipo_codigo);
  }

  if (params.tipo_is_virtual !== undefined) {
    query = query.eq('tipo_is_virtual', params.tipo_is_virtual);
  }

  // Filtros de data
  if (params.data_inicio_inicio) {
    query = query.gte('data_inicio', params.data_inicio_inicio);
  }

  if (params.data_inicio_fim) {
    query = query.lte('data_inicio', params.data_inicio_fim);
  }

  if (params.data_fim_inicio) {
    query = query.gte('data_fim', params.data_fim_inicio);
  }

  if (params.data_fim_fim) {
    query = query.lte('data_fim', params.data_fim_fim);
  }

  // Ordenação
  const ordenarPor = params.ordenar_por ?? 'data_inicio';
  const ordem = params.ordem ?? 'asc';
  query = query.order(ordenarPor, { ascending: ordem === 'asc' });

  // Aplicar paginação
  query = query.range(offset, offset + limite - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar audiências: ${error.message}`);
  }

  // Converter dados do formato do join para formato de retorno
  const audiencias = (data || []).map((row: Record<string, unknown>) => {
    // O Supabase retorna os dados do join em formato aninhado
    // Precisamos extrair responsavel_id do objeto acervo
    let responsavelId: number | null = null;
    
    if (row.acervo) {
      const acervoData = Array.isArray(row.acervo) ? row.acervo[0] : row.acervo;
      if (acervoData && typeof acervoData === 'object' && 'responsavel_id' in acervoData) {
        responsavelId = (acervoData as { responsavel_id: number | null }).responsavel_id;
      }
    }

    // Criar objeto com todos os campos de audiencias + responsavel_id
    const audienciaData: Record<string, unknown> = {
      ...row,
      responsavel_id: responsavelId,
    };

    // Remover o objeto acervo aninhado
    delete audienciaData.acervo;

    return converterParaAudiencia(audienciaData);
  });

  const total = count ?? 0;
  const totalPaginas = Math.ceil(total / limite);

  return {
    audiencias,
    total,
    pagina,
    limite,
    totalPaginas,
  };
}

