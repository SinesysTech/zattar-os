// Serviço de persistência de endereços
// Gerencia endereços polimórficos para clientes, partes_contrarias e terceiros

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type {
  Endereco,
  CriarEnderecoParams,
  AtualizarEnderecoParams,
  ListarEnderecosParams,
  ListarEnderecosResult,
  BuscarEnderecosPorEntidadeParams,
  DefinirEnderecoPrincipalParams,
} from '@/backend/types/partes/enderecos-types';

/**
 * Resultado de operação
 */
export interface OperacaoEnderecoResult {
  sucesso: boolean;
  endereco?: Endereco;
  erro?: string;
}

/**
 * Valida CEP básico (formato)
 */
function validarCep(cep: string): boolean {
  const cepLimpo = cep.replace(/\D/g, '');
  return cepLimpo.length === 8;
}

/**
 * Normaliza CEP removendo formatação
 */
function normalizarCep(cep: string): string {
  return cep.replace(/\D/g, '');
}

/**
 * Converte dados do banco para formato de retorno
 */
function converterParaEndereco(data: Record<string, unknown>): Endereco {
  return {
    id: data.id as number,
    id_pje: (data.id_pje as number | null) ?? null,
    entidade_tipo: data.entidade_tipo as 'cliente' | 'parte_contraria' | 'terceiro',
    entidade_id: data.entidade_id as number,
    trt: (data.trt as string) ?? null,
    grau: (data.grau as 'primeiro_grau' | 'segundo_grau') ?? null,
    numero_processo: (data.numero_processo as string) ?? null,
    logradouro: (data.logradouro as string | null) ?? null,
    numero: (data.numero as string | null) ?? null,
    complemento: (data.complemento as string | null) ?? null,
    bairro: (data.bairro as string | null) ?? null,
    id_municipio_pje: (data.id_municipio_pje as number | null) ?? null,
    municipio: (data.municipio as string | null) ?? null,
    municipio_ibge: (data.municipio_ibge as string | null) ?? null,
    estado_id_pje: (data.estado_id_pje as number | null) ?? null,
    estado_sigla: (data.estado_sigla as string | null) ?? null,
    estado_descricao: (data.estado_descricao as string | null) ?? null,
    estado: (data.estado as string | null) ?? null,
    pais_id_pje: (data.pais_id_pje as number | null) ?? null,
    pais_codigo: (data.pais_codigo as string | null) ?? null,
    pais_descricao: (data.pais_descricao as string | null) ?? null,
    pais: (data.pais as string | null) ?? null,
    cep: (data.cep as string | null) ?? null,
    classificacoes_endereco: (data.classificacoes_endereco as any[] | null) ?? null,
    correspondencia: (data.correspondencia as boolean | null) ?? null,
    situacao: (data.situacao as 'A' | 'I' | 'P' | 'H' | null) ?? null,
    dados_pje_completo: (data.dados_pje_completo as Record<string, unknown> | null) ?? null,
    id_usuario_cadastrador_pje: (data.id_usuario_cadastrador_pje as number | null) ?? null,
    data_alteracao_pje: (data.data_alteracao_pje as string | null) ?? null,
    ativo: (data.ativo as boolean | null) ?? null,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}

/**
 * Cria um novo endereço
 */
export async function criarEndereco(
  params: CriarEnderecoParams
): Promise<OperacaoEnderecoResult> {
  const supabase = createServiceClient();

  try {
    // Validações
    if (!params.entidade_tipo) {
      return { sucesso: false, erro: 'Tipo de entidade é obrigatório' };
    }

    if (!params.entidade_id) {
      return { sucesso: false, erro: 'ID da entidade é obrigatório' };
    }

    if (params.cep && !validarCep(params.cep)) {
      return { sucesso: false, erro: 'CEP inválido (deve conter 8 dígitos)' };
    }

    // Preparar dados para inserção
    const dadosNovos: Record<string, unknown> = {
      id_pje: params.id_pje ?? null,
      entidade_tipo: params.entidade_tipo,
      entidade_id: params.entidade_id,
      trt: params.trt,
      grau: params.grau,
      numero_processo: params.numero_processo,
      logradouro: params.logradouro?.trim() || null,
      numero: params.numero?.trim() || null,
      complemento: params.complemento?.trim() || null,
      bairro: params.bairro?.trim() || null,
      municipio: params.municipio?.trim() || null,
      estado: params.estado?.trim() || null,
      pais: params.pais?.trim() || null,
      cep: params.cep ? normalizarCep(params.cep) : null,
      classificacoes_endereco: params.classificacoes_endereco ?? null,
      correspondencia: params.correspondencia ?? false,
      situacao: params.situacao ?? null,
      dados_pje_completo: params.dados_pje_completo ?? null,
    };

    const { data, error } = await supabase.from('enderecos').insert(dadosNovos).select().single();

    if (error) {
      console.error('Erro ao criar endereço:', error);
      return { sucesso: false, erro: `Erro ao criar endereço: ${error.message}` };
    }

    return {
      sucesso: true,
      endereco: converterParaEndereco(data),
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao criar endereço:', error);
    return { sucesso: false, erro: `Erro inesperado: ${erroMsg}` };
  }
}

/**
 * Atualiza um endereço existente
 */
export async function atualizarEndereco(
  params: AtualizarEnderecoParams
): Promise<OperacaoEnderecoResult> {
  const supabase = createServiceClient();

  try {
    // Verificar se existe
    const { data: existente, error: erroBusca } = await supabase
      .from('enderecos')
      .select('id')
      .eq('id', params.id)
      .single();

    if (erroBusca || !existente) {
      return { sucesso: false, erro: 'Endereço não encontrado' };
    }

    if (params.cep && !validarCep(params.cep)) {
      return { sucesso: false, erro: 'CEP inválido (deve conter 8 dígitos)' };
    }

    // Preparar dados para atualização
    const dadosAtualizacao: Record<string, unknown> = {};

    if (params.id_pje !== undefined) dadosAtualizacao.id_pje = params.id_pje;
    if (params.entidade_tipo !== undefined) dadosAtualizacao.entidade_tipo = params.entidade_tipo;
    if (params.entidade_id !== undefined) dadosAtualizacao.entidade_id = params.entidade_id;
    if (params.trt !== undefined) dadosAtualizacao.trt = params.trt;
    if (params.grau !== undefined) dadosAtualizacao.grau = params.grau;
    if (params.numero_processo !== undefined)
      dadosAtualizacao.numero_processo = params.numero_processo;
    if (params.logradouro !== undefined)
      dadosAtualizacao.logradouro = params.logradouro?.trim() || null;
    if (params.numero !== undefined) dadosAtualizacao.numero = params.numero?.trim() || null;
    if (params.complemento !== undefined)
      dadosAtualizacao.complemento = params.complemento?.trim() || null;
    if (params.bairro !== undefined) dadosAtualizacao.bairro = params.bairro?.trim() || null;
    if (params.municipio !== undefined)
      dadosAtualizacao.municipio = params.municipio?.trim() || null;
    if (params.estado !== undefined) dadosAtualizacao.estado = params.estado?.trim() || null;
    if (params.pais !== undefined) dadosAtualizacao.pais = params.pais?.trim() || null;
    if (params.cep !== undefined)
      dadosAtualizacao.cep = params.cep ? normalizarCep(params.cep) : null;
    if (params.classificacoes_endereco !== undefined)
      dadosAtualizacao.classificacoes_endereco = params.classificacoes_endereco;
    if (params.correspondencia !== undefined)
      dadosAtualizacao.correspondencia = params.correspondencia;
    if (params.situacao !== undefined) dadosAtualizacao.situacao = params.situacao;
    if (params.dados_pje_completo !== undefined)
      dadosAtualizacao.dados_pje_completo = params.dados_pje_completo;

    const { data, error } = await supabase
      .from('enderecos')
      .update(dadosAtualizacao)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar endereço:', error);
      return { sucesso: false, erro: `Erro ao atualizar: ${error.message}` };
    }

    return {
      sucesso: true,
      endereco: converterParaEndereco(data),
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao atualizar endereço:', error);
    return { sucesso: false, erro: `Erro inesperado: ${erroMsg}` };
  }
}

/**
 * Busca um endereço por ID
 */
export async function buscarEnderecoPorId(id: number): Promise<Endereco | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase.from('enderecos').select('*').eq('id', id).single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar endereço: ${error.message}`);
  }

  return data ? converterParaEndereco(data) : null;
}

/**
 * Busca endereços por entidade
 */
export async function buscarEnderecosPorEntidade(
  params: BuscarEnderecosPorEntidadeParams
): Promise<Endereco[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('enderecos')
    .select('*')
    .eq('entidade_tipo', params.entidade_tipo)
    .eq('entidade_id', params.entidade_id)
    .order('correspondencia', { ascending: false }) // Endereço de correspondência primeiro
    .order('situacao', { ascending: true }); // Principal (P) antes de outros

  if (error) {
    throw new Error(`Erro ao buscar endereços: ${error.message}`);
  }

  return (data || []).map(converterParaEndereco);
}

/**
 * Lista endereços com filtros e paginação
 */
export async function listarEnderecos(
  params: ListarEnderecosParams = {}
): Promise<ListarEnderecosResult> {
  const supabase = createServiceClient();

  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 50;
  const offset = (pagina - 1) * limite;

  let query = supabase.from('enderecos').select('*', { count: 'exact' });

  // Aplicar filtros
  if (params.entidade_tipo) {
    query = query.eq('entidade_tipo', params.entidade_tipo);
  }

  if (params.entidade_id) {
    query = query.eq('entidade_id', params.entidade_id);
  }

  if (params.trt) {
    query = query.eq('trt', params.trt);
  }

  if (params.grau) {
    query = query.eq('grau', params.grau);
  }

  if (params.numero_processo) {
    query = query.eq('numero_processo', params.numero_processo);
  }

  if (params.busca) {
    const busca = params.busca.trim();
    query = query.or(
      `logradouro.ilike.%${busca}%,bairro.ilike.%${busca}%,municipio.ilike.%${busca}%,estado.ilike.%${busca}%`
    );
  }

  if (params.municipio) {
    query = query.ilike('municipio', `%${params.municipio}%`);
  }

  if (params.estado) {
    query = query.eq('estado', params.estado);
  }

  if (params.pais) {
    query = query.eq('pais', params.pais);
  }

  if (params.cep) {
    query = query.eq('cep', normalizarCep(params.cep));
  }

  if (params.correspondencia !== undefined) {
    query = query.eq('correspondencia', params.correspondencia);
  }

  if (params.situacao) {
    query = query.eq('situacao', params.situacao);
  }

  // Ordenação
  const ordenarPor = params.ordenar_por ?? 'created_at';
  const ordem = params.ordem ?? 'desc';
  query = query.order(ordenarPor, { ascending: ordem === 'asc' });

  // Aplicar paginação
  query = query.range(offset, offset + limite - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar endereços: ${error.message}`);
  }

  const enderecos = (data || []).map(converterParaEndereco);
  const total = count ?? 0;
  const totalPaginas = Math.ceil(total / limite);

  return {
    enderecos,
    total,
    pagina,
    limite,
    totalPaginas,
  };
}

/**
 * Define um endereço como principal (situacao='P')
 * Remove a flag principal de outros endereços da mesma entidade
 */
export async function definirEnderecoPrincipal(
  params: DefinirEnderecoPrincipalParams
): Promise<OperacaoEnderecoResult> {
  const supabase = createServiceClient();

  try {
    // Verificar se o endereço existe
    const endereco = await buscarEnderecoPorId(params.id);
    if (!endereco) {
      return { sucesso: false, erro: 'Endereço não encontrado' };
    }

    // Remover flag principal de outros endereços da mesma entidade
    const { error: errorRemove } = await supabase
      .from('enderecos')
      .update({ situacao: 'A' }) // A=Ativo
      .eq('entidade_tipo', params.entidade_tipo)
      .eq('entidade_id', params.entidade_id)
      .eq('situacao', 'P');

    if (errorRemove) {
      console.error('Erro ao remover flag principal:', errorRemove);
      return { sucesso: false, erro: `Erro ao atualizar endereços: ${errorRemove.message}` };
    }

    // Definir o endereço atual como principal
    const { data, error } = await supabase
      .from('enderecos')
      .update({ situacao: 'P' })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao definir endereço principal:', error);
      return { sucesso: false, erro: `Erro ao atualizar: ${error.message}` };
    }

    return {
      sucesso: true,
      endereco: converterParaEndereco(data),
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao definir endereço principal:', error);
    return { sucesso: false, erro: `Erro inesperado: ${erroMsg}` };
  }
}

/**
 * Deleta um endereço por ID
 */
export async function deletarEndereco(id: number): Promise<OperacaoEnderecoResult> {
  const supabase = createServiceClient();

  try {
    const { error } = await supabase.from('enderecos').delete().eq('id', id);

    if (error) {
      console.error('Erro ao deletar endereço:', error);
      return { sucesso: false, erro: `Erro ao deletar: ${error.message}` };
    }

    return { sucesso: true };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao deletar:', error);
    return { sucesso: false, erro: `Erro inesperado: ${erroMsg}` };
  }
}
