// Serviço de persistência de assistentes
// Gerencia operações de CRUD na tabela assistentes

import { createServiceClient } from '@/backend/utils/supabase/service-client';

/**
 * Dados retornados do banco
 */
export interface Assistente {
  id: number;
  nome: string;
  descricao: string | null;
  iframe_code: string;
  ativo: boolean;
  criado_por: number;
  created_at: string;
  updated_at: string;
}

/**
 * Parâmetros para listar assistentes
 */
export interface ListarAssistentesParams {
  pagina?: number;
  limite?: number;
  busca?: string; // Busca em nome e descricao
  ativo?: boolean;
}

/**
 * Resultado da listagem
 */
export interface ListarAssistentesResult {
  assistentes: Assistente[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

/**
 * Dados para criação de assistente
 */
export interface CriarAssistenteData {
  nome: string;
  descricao?: string;
  iframe_code: string;
  criado_por: number;
}

/**
 * Dados para atualização de assistente
 */
export interface AtualizarAssistenteData {
  nome?: string;
  descricao?: string;
  iframe_code?: string;
  ativo?: boolean;
}

/**
 * Resultado de operação
 */
export interface OperacaoAssistenteResult {
  sucesso: boolean;
  assistente?: Assistente;
  erro?: string;
}

/**
 * Converte dados do banco para formato de retorno
 */
function converterParaAssistente(data: Record<string, unknown>): Assistente {
  return {
    id: data.id as number,
    nome: data.nome as string,
    descricao: (data.descricao as string | null) ?? null,
    iframe_code: data.iframe_code as string,
    ativo: data.ativo as boolean,
    criado_por: data.criado_por as number,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}

/**
 * Validações para criação e atualização
 */
function validarDadosAssistente(data: Partial<CriarAssistenteData | AtualizarAssistenteData>): string | null {
  if (data.nome !== undefined) {
    if (!data.nome.trim()) {
      return 'Nome é obrigatório';
    }
    if (data.nome.length < 1 || data.nome.length > 200) {
      return 'Nome deve ter entre 1 e 200 caracteres';
    }
  }

  if (data.descricao !== undefined && data.descricao !== null) {
    if (data.descricao.length > 1000) {
      return 'Descrição deve ter no máximo 1000 caracteres';
    }
  }

  if (data.iframe_code !== undefined) {
    if (!data.iframe_code.trim()) {
      return 'Código do iframe é obrigatório';
    }
  }

  return null;
}

/**
 * Lista assistentes com paginação e filtros
 */
export async function listarAssistentes(
  params: ListarAssistentesParams = {}
): Promise<ListarAssistentesResult> {
  const supabase = createServiceClient();

  const pagina = params.pagina ?? 1;
  const limite = params.limite ?? 50;
  const offset = (pagina - 1) * limite;

  let query = supabase.from('assistentes').select('*', { count: 'exact' });

  // Aplicar filtros
  if (params.busca) {
    const busca = params.busca.trim();
    query = query.or(`nome.ilike.%${busca}%,descricao.ilike.%${busca}%`);
  }

  if (params.ativo !== undefined) {
    query = query.eq('ativo', params.ativo);
  }

  // Aplicar paginação
  query = query.order('created_at', { ascending: false }).range(offset, offset + limite - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Erro ao listar assistentes:', error);
    throw new Error(`Erro ao listar assistentes: ${error.message}`);
  }

  const assistentes = (data || []).map(converterParaAssistente);
  const total = count ?? 0;
  const totalPaginas = Math.ceil(total / limite);

  return {
    assistentes,
    total,
    pagina,
    limite,
    totalPaginas,
  };
}

/**
 * Busca um assistente por ID
 */
export async function buscarAssistentePorId(id: number): Promise<Assistente | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('assistentes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar assistente: ${error.message}`);
  }

  return data ? converterParaAssistente(data) : null;
}

/**
 * Cria um novo assistente
 */
export async function criarAssistente(
  data: CriarAssistenteData
): Promise<OperacaoAssistenteResult> {
  const supabase = createServiceClient();

  try {
    // Validações
    const erroValidacao = validarDadosAssistente(data);
    if (erroValidacao) {
      return { sucesso: false, erro: erroValidacao };
    }

    // Preparar dados para inserção
    const dadosNovos = {
      nome: data.nome.trim(),
      descricao: data.descricao?.trim() || null,
      iframe_code: data.iframe_code.trim(),
      criado_por: data.criado_por,
      ativo: true, // Default ativo
    };

    // Inserir assistente
    const { data: inserted, error } = await supabase
      .from('assistentes')
      .insert(dadosNovos)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar assistente:', error);
      return { sucesso: false, erro: `Erro ao criar assistente: ${error.message}` };
    }

    return {
      sucesso: true,
      assistente: converterParaAssistente(inserted),
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao criar assistente:', error);
    return { sucesso: false, erro: `Erro inesperado: ${erroMsg}` };
  }
}

/**
 * Atualiza um assistente existente
 */
export async function atualizarAssistente(
  id: number,
  data: AtualizarAssistenteData
): Promise<OperacaoAssistenteResult> {
  const supabase = createServiceClient();

  try {
    // Verificar se assistente existe
    const assistenteExistente = await buscarAssistentePorId(id);
    if (!assistenteExistente) {
      return { sucesso: false, erro: 'Assistente não encontrado' };
    }

    // Validações
    const erroValidacao = validarDadosAssistente(data);
    if (erroValidacao) {
      return { sucesso: false, erro: erroValidacao };
    }

    // Preparar dados para atualização
    const dadosAtualizacao: Record<string, unknown> = {};

    if (data.nome !== undefined) {
      dadosAtualizacao.nome = data.nome.trim();
    }
    if (data.descricao !== undefined) {
      dadosAtualizacao.descricao = data.descricao?.trim() || null;
    }
    if (data.iframe_code !== undefined) {
      dadosAtualizacao.iframe_code = data.iframe_code.trim();
    }
    if (data.ativo !== undefined) {
      dadosAtualizacao.ativo = data.ativo;
    }

    // Atualizar assistente
    const { data: updated, error } = await supabase
      .from('assistentes')
      .update(dadosAtualizacao)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar assistente:', error);
      return { sucesso: false, erro: `Erro ao atualizar assistente: ${error.message}` };
    }

    return {
      sucesso: true,
      assistente: converterParaAssistente(updated),
    };
  } catch (error) {
    const erroMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro inesperado ao atualizar assistente:', error);
    return { sucesso: false, erro: `Erro inesperado: ${erroMsg}` };
  }
}

/**
 * Deleta um assistente (hard delete)
 */
export async function deletarAssistente(id: number): Promise<boolean> {
  const supabase = createServiceClient();

  try {
    // Verificar se assistente existe
    const assistenteExistente = await buscarAssistentePorId(id);
    if (!assistenteExistente) {
      return false;
    }

    // Deletar assistente
    const { error } = await supabase
      .from('assistentes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar assistente:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro inesperado ao deletar assistente:', error);
    return false;
  }
}