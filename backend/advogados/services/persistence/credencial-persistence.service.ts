// Serviço de persistência de credenciais
// Gerencia operações de CRUD na tabela credenciais

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type {
  Credencial,
  CredencialComAdvogado,
  CriarCredencialParams,
  AtualizarCredencialParams,
  ListarCredenciaisParams,
} from '@/backend/types/credenciais/types';

/**
 * Criar uma nova credencial
 */
export async function criarCredencial(params: CriarCredencialParams): Promise<Credencial> {
  const supabase = createServiceClient();

  // Verificar se advogado existe
  const { data: advogado } = await supabase
    .from('advogados')
    .select('id')
    .eq('id', params.advogado_id)
    .single();

  if (!advogado) {
    throw new Error('Advogado não encontrado');
  }

  // Verificar se já existe credencial ativa para mesmo tribunal e grau
  const { data: existente } = await supabase
    .from('credenciais')
    .select('id')
    .eq('advogado_id', params.advogado_id)
    .eq('tribunal', params.tribunal)
    .eq('grau', params.grau)
    .eq('active', true)
    .single();

  if (existente) {
    throw new Error(
      `Já existe credencial ativa para este advogado, tribunal ${params.tribunal} e grau ${params.grau}`
    );
  }

  const { data, error } = await supabase
    .from('credenciais')
    .insert({
      advogado_id: params.advogado_id,
      tribunal: params.tribunal,
      grau: params.grau,
      senha: params.senha,
      active: params.active !== undefined ? params.active : true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar credencial: ${error.message}`);
  }

  if (!data) {
    throw new Error('Erro ao criar credencial: nenhum dado retornado');
  }

  // Retornar sem senha por segurança
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { senha, ...credencialSemSenha } = data;
  return credencialSemSenha as Credencial;
}

/**
 * Buscar credencial por ID
 */
export async function buscarCredencial(id: number): Promise<Credencial | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('credenciais')
    .select('id, advogado_id, tribunal, grau, active, created_at, updated_at')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Não encontrado
    }
    throw new Error(`Erro ao buscar credencial: ${error.message}`);
  }

  return data as Credencial;
}

/**
 * Atualizar credencial
 */
export async function atualizarCredencial(
  id: number,
  params: AtualizarCredencialParams
): Promise<Credencial> {
  const supabase = createServiceClient();

  // Se tribunal ou grau está sendo atualizado, verificar unicidade
  if (params.tribunal !== undefined || params.grau !== undefined) {
    // Buscar credencial atual para obter advogado_id
    const { data: credencialAtual } = await supabase
      .from('credenciais')
      .select('advogado_id, tribunal, grau')
      .eq('id', id)
      .single();

    if (!credencialAtual) {
      throw new Error('Credencial não encontrada');
    }

    const tribunalFinal = params.tribunal ?? credencialAtual.tribunal;
    const grauFinal = params.grau ?? credencialAtual.grau;

    // Verificar se já existe outra credencial ativa com mesma combinação
    const { data: existente } = await supabase
      .from('credenciais')
      .select('id')
      .eq('advogado_id', credencialAtual.advogado_id)
      .eq('tribunal', tribunalFinal)
      .eq('grau', grauFinal)
      .eq('active', true)
      .neq('id', id)
      .single();

    if (existente) {
      throw new Error(
        `Já existe credencial ativa para este advogado, tribunal ${tribunalFinal} e grau ${grauFinal}`
      );
    }
  }

  // Montar objeto de atualização apenas com campos fornecidos
  const updateData: Partial<{
    tribunal: string;
    grau: string;
    senha: string;
    active: boolean;
  }> = {};

  if (params.tribunal !== undefined) {
    updateData.tribunal = params.tribunal;
  }
  if (params.grau !== undefined) {
    updateData.grau = params.grau;
  }
  if (params.senha !== undefined) {
    updateData.senha = params.senha;
  }
  if (params.active !== undefined) {
    updateData.active = params.active;
  }

  const { data, error } = await supabase
    .from('credenciais')
    .update(updateData)
    .eq('id', id)
    .select('id, advogado_id, tribunal, grau, active, created_at, updated_at')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Credencial não encontrada');
    }
    throw new Error(`Erro ao atualizar credencial: ${error.message}`);
  }

  if (!data) {
    throw new Error('Erro ao atualizar credencial: nenhum dado retornado');
  }

  return data as Credencial;
}

/**
 * Listar credenciais de um advogado
 */
export async function listarCredenciais(
  params: ListarCredenciaisParams
): Promise<CredencialComAdvogado[]> {
  const supabase = createServiceClient();

  // Verificar se advogado existe
  const { data: advogado } = await supabase
    .from('advogados')
    .select('id, nome_completo, cpf, oab, uf_oab')
    .eq('id', params.advogado_id)
    .single();

  if (!advogado) {
    throw new Error('Advogado não encontrado');
  }

  let query = supabase
    .from('credenciais')
    .select('id, advogado_id, tribunal, grau, active, created_at, updated_at')
    .eq('advogado_id', params.advogado_id);

  // Filtro por status ativo/inativo
  if (params.active !== undefined) {
    query = query.eq('active', params.active);
  }

  // Ordenação
  query = query.order('tribunal', { ascending: true }).order('grau', { ascending: true });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao listar credenciais: ${error.message}`);
  }

  // Adicionar informações do advogado
  return (data || []).map((credencial) => ({
    ...credencial,
    advogado_nome: advogado.nome_completo,
    advogado_cpf: advogado.cpf,
    advogado_oab: advogado.oab,
    advogado_uf_oab: advogado.uf_oab,
  })) as CredencialComAdvogado[];
}

