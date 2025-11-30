/**
 * Serviço de persistência para expedientes manuais
 * Responsável por operações CRUD na tabela expedientes_manuais
 */

import { createClient } from '@/backend/utils/supabase/server-client';
import {
  ExpedienteManual,
  CriarExpedienteManualParams,
  AtualizarExpedienteManualParams,
  BaixarExpedienteManualParams,
  ListarExpedientesManuaisParams,
  ListarExpedientesManuaisResult,
} from '@/backend/types/expedientes-manuais/types';

/**
 * Criar um novo expediente manual
 */
export const criarExpedienteManual = async (
  params: CriarExpedienteManualParams,
  criado_por: number
): Promise<ExpedienteManual> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('expedientes_manuais')
    .insert({
      processo_id: params.processo_id,
      tipo_expediente_id: params.tipo_expediente_id || null,
      descricao: params.descricao,
      data_prazo_legal: params.data_prazo_legal || null,
      responsavel_id: params.responsavel_id || null,
      criado_por,
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar expediente manual:', error);
    throw new Error(`Falha ao criar expediente manual: ${error.message}`);
  }

  return data;
};

/**
 * Buscar expediente manual por ID
 */
export const buscarExpedienteManualPorId = async (
  id: number
): Promise<ExpedienteManual | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('expedientes_manuais')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Não encontrado
    }
    console.error('Erro ao buscar expediente manual:', error);
    throw new Error(`Falha ao buscar expediente manual: ${error.message}`);
  }

  return data;
};

/**
 * Atualizar expediente manual
 */
export const atualizarExpedienteManual = async (
  id: number,
  params: AtualizarExpedienteManualParams
): Promise<ExpedienteManual> => {
  const supabase = await createClient();

  const updateData: Record<string, any> = {};

  if (params.tipo_expediente_id !== undefined) {
    updateData.tipo_expediente_id = params.tipo_expediente_id;
  }
  if (params.descricao !== undefined) {
    updateData.descricao = params.descricao;
  }
  if (params.data_prazo_legal !== undefined) {
    updateData.data_prazo_legal = params.data_prazo_legal;
  }
  if (params.responsavel_id !== undefined) {
    updateData.responsavel_id = params.responsavel_id;
  }

  const { data, error } = await supabase
    .from('expedientes_manuais')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar expediente manual:', error);
    throw new Error(`Falha ao atualizar expediente manual: ${error.message}`);
  }

  return data;
};

/**
 * Baixar expediente manual (marcar como concluído)
 */
export const baixarExpedienteManual = async (
  id: number,
  params: BaixarExpedienteManualParams
): Promise<ExpedienteManual> => {
  const supabase = await createClient();

  // Validação: protocolo_id OU justificativa_baixa deve estar preenchido
  if (!params.protocolo_id && !params.justificativa_baixa) {
    throw new Error(
      'É obrigatório informar o protocolo ou a justificativa para baixar o expediente'
    );
  }

  const { data, error } = await supabase
    .from('expedientes_manuais')
    .update({
      baixado_em: new Date().toISOString(),
      protocolo_id: params.protocolo_id || null,
      justificativa_baixa: params.justificativa_baixa || null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao baixar expediente manual:', error);
    throw new Error(`Falha ao baixar expediente manual: ${error.message}`);
  }

  return data;
};

/**
 * Reverter baixa de expediente manual
 */
export const reverterBaixaExpedienteManual = async (
  id: number
): Promise<ExpedienteManual> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('expedientes_manuais')
    .update({
      baixado_em: null,
      protocolo_id: null,
      justificativa_baixa: null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao reverter baixa de expediente manual:', error);
    throw new Error(
      `Falha ao reverter baixa de expediente manual: ${error.message}`
    );
  }

  return data;
};

/**
 * Deletar expediente manual
 */
export const deletarExpedienteManual = async (
  id: number
): Promise<void> => {
  const supabase = await createClient();

  const { error } = await supabase
    .from('expedientes_manuais')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao deletar expediente manual:', error);
    throw new Error(`Falha ao deletar expediente manual: ${error.message}`);
  }
};

/**
 * Listar expedientes manuais com filtros e paginação
 */
export const listarExpedientesManuais = async (
  params: ListarExpedientesManuaisParams = {}
): Promise<ListarExpedientesManuaisResult> => {
  const supabase = await createClient();

  const {
    pagina = 0,
    limite = 20,
    busca,
    processo_id,
    trt,
    grau,
    tipo_expediente_id,
    responsavel_id,
    prazo_vencido,
    baixado,
    criado_por,
    data_prazo_legal_inicio,
    data_prazo_legal_fim,
    ordenar_por = 'created_at',
    ordem = 'desc',
  } = params;

  // Query base
  let query = supabase.from('expedientes_manuais').select('*', { count: 'exact' });

  // Filtros
  if (busca) {
    query = query.or(
      `numero_processo.ilike.%${busca}%,descricao.ilike.%${busca}%`
    );
  }

  if (processo_id !== undefined) {
    query = query.eq('processo_id', processo_id);
  }

  if (trt) {
    query = query.eq('trt', trt);
  }

  if (grau) {
    query = query.eq('grau', grau);
  }

  if (tipo_expediente_id !== undefined) {
    query = query.eq('tipo_expediente_id', tipo_expediente_id);
  }

  if (responsavel_id !== undefined) {
    if (responsavel_id === 'null') {
      query = query.is('responsavel_id', null);
    } else {
      query = query.eq('responsavel_id', responsavel_id);
    }
  }

  if (prazo_vencido !== undefined) {
    query = query.eq('prazo_vencido', prazo_vencido);
  }

  if (baixado !== undefined) {
    if (baixado) {
      query = query.not('baixado_em', 'is', null);
    } else {
      query = query.is('baixado_em', null);
    }
  }

  if (criado_por !== undefined) {
    query = query.eq('criado_por', criado_por);
  }

  if (data_prazo_legal_inicio) {
    query = query.gte('data_prazo_legal', data_prazo_legal_inicio);
  }

  if (data_prazo_legal_fim) {
    query = query.lte('data_prazo_legal', data_prazo_legal_fim);
  }

  // Ordenação
  query = query.order(ordenar_por, { ascending: ordem === 'asc' });

  // Paginação
  const inicio = pagina * limite;
  query = query.range(inicio, inicio + limite - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Erro ao listar expedientes manuais:', error);
    throw new Error(`Falha ao listar expedientes manuais: ${error.message}`);
  }

  const total = count || 0;
  const totalPaginas = Math.ceil(total / limite);

  return {
    expedientes: data || [],
    total,
    pagina,
    limite,
    totalPaginas,
  };
};

/**
 * Atribuir responsável a expediente manual
 */
export const atribuirResponsavelExpedienteManual = async (
  id: number,
  responsavel_id: number | null
): Promise<ExpedienteManual> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('expedientes_manuais')
    .update({ responsavel_id })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atribuir responsável:', error);
    throw new Error(`Falha ao atribuir responsável: ${error.message}`);
  }

  return data;
};

/**
 * Buscar expedientes manuais por CPF do cliente
 * Retorna todos os expedientes dos processos relacionados ao cliente com o CPF informado
 */
export const buscarExpedientesPorClienteCPF = async (
  cpf: string
): Promise<ExpedienteManual[]> => {
  const supabase = await createClient();

  // Normalizar CPF (remover formatação)
  const cpfNormalizado = cpf.replace(/\D/g, '');

  if (!cpfNormalizado || cpfNormalizado.length !== 11) {
    throw new Error('CPF inválido. Deve conter 11 dígitos.');
  }

  // Buscar IDs dos clientes com o CPF fornecido
  const { data: clienteIdsData, error: clienteError } = await supabase
    .from('clientes')
    .select('id')
    .eq('cpf', cpfNormalizado);

  if (clienteError) {
    console.error('Erro ao buscar IDs de clientes:', clienteError);
    throw new Error(`Falha ao buscar IDs de clientes: ${clienteError.message}`);
  }

  const entidadeIds = clienteIdsData.map(c => c.id);

  if (entidadeIds.length === 0) {
    return []; // Nenhum cliente encontrado com este CPF
  }

  // Buscar expedientes através da relação:
  // clientes -> processo_partes -> processos -> expedientes_manuais
  const { data, error } = await supabase
    .from('expedientes_manuais')
    .select(`
      *,
      processo:processos!inner(
        id,
        numero_processo,
        processo_partes!inner(
          id,
          tipo_entidade,
          entidade_id
        )
      )
    `)
    .eq('processo.processo_partes.tipo_entidade', 'cliente')
    .in('processo.processo_partes.entidade_id', entidadeIds)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Erro ao buscar expedientes por CPF do cliente:', error);
    throw new Error(`Falha ao buscar expedientes por CPF: ${error.message}`);
  }

  return data || [];
};
