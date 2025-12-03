/**
 * Serviço de persistência para templates de documentos
 *
 * Responsável por operações relacionadas a templates.
 */

import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type {
  Template,
  CriarTemplateParams,
  AtualizarTemplateParams,
  TemplateComUsuario,
  ListarTemplatesParams,
} from '@/backend/types/documentos/types';

/**
 * Cria um novo template
 */
export async function criarTemplate(
  params: CriarTemplateParams,
  usuario_id: number
): Promise<Template> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('templates')
    .insert({
      titulo: params.titulo,
      descricao: params.descricao ?? null,
      conteudo: params.conteudo,
      visibilidade: params.visibilidade,
      categoria: params.categoria ?? null,
      thumbnail_url: params.thumbnail_url ?? null,
      criado_por: usuario_id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar template: ${error.message}`);
  }

  return data;
}

/**
 * Busca um template por ID
 */
export async function buscarTemplatePorId(id: number): Promise<Template | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('templates')
    .select()
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar template: ${error.message}`);
  }

  return data;
}

/**
 * Busca template com informações do usuário
 */
export async function buscarTemplateComUsuario(id: number): Promise<TemplateComUsuario | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('templates')
    .select(`
      *,
      criador:usuarios!templates_criado_por_fkey(
        id,
        nomeCompleto,
        nomeExibicao
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Erro ao buscar template com usuário: ${error.message}`);
  }

  return data as unknown as TemplateComUsuario;
}

/**
 * Lista templates com filtros
 */
export async function listarTemplates(
  params: ListarTemplatesParams,
  usuario_id?: number
): Promise<{ templates: TemplateComUsuario[]; total: number }> {
  const supabase = createServiceClient();

  let query = supabase
    .from('templates')
    .select(`
      *,
      criador:usuarios!templates_criado_por_fkey(
        id,
        nomeCompleto,
        nomeExibicao
      )
    `, { count: 'exact' });

  // Filtro: visibilidade
  if (params.visibilidade) {
    query = query.eq('visibilidade', params.visibilidade);
  } else if (usuario_id) {
    // Se não especificado, mostrar públicos + privados do usuário
    query = query.or(`visibilidade.eq.publico,criado_por.eq.${usuario_id}`);
  } else {
    // Apenas públicos para usuários não autenticados
    query = query.eq('visibilidade', 'publico');
  }

  // Filtro: categoria
  if (params.categoria) {
    query = query.eq('categoria', params.categoria);
  }

  // Filtro: criado_por
  if (params.criado_por) {
    query = query.eq('criado_por', params.criado_por);
  }

  // Filtro: busca (título ou descrição)
  if (params.busca) {
    query = query.or(`titulo.ilike.%${params.busca}%,descricao.ilike.%${params.busca}%`);
  }

  // Ordenação por uso e data
  query = query.order('uso_count', { ascending: false });
  query = query.order('created_at', { ascending: false });

  // Paginação
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao listar templates: ${error.message}`);
  }

  return {
    templates: (data as unknown as TemplateComUsuario[]) ?? [],
    total: count ?? 0,
  };
}

/**
 * Atualiza um template existente
 */
export async function atualizarTemplate(
  id: number,
  params: AtualizarTemplateParams
): Promise<Template> {
  const supabase = createServiceClient();

  const updateData: Record<string, unknown> = {};

  if (params.titulo !== undefined) updateData.titulo = params.titulo;
  if (params.descricao !== undefined) updateData.descricao = params.descricao;
  if (params.conteudo !== undefined) updateData.conteudo = params.conteudo;
  if (params.visibilidade !== undefined) updateData.visibilidade = params.visibilidade;
  if (params.categoria !== undefined) updateData.categoria = params.categoria;
  if (params.thumbnail_url !== undefined) updateData.thumbnail_url = params.thumbnail_url;

  const { data, error } = await supabase
    .from('templates')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar template: ${error.message}`);
  }

  return data;
}

/**
 * Deleta um template permanentemente
 */
export async function deletarTemplate(id: number): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Erro ao deletar template: ${error.message}`);
  }
}

/**
 * Incrementa o contador de uso de um template
 */
export async function incrementarUsoTemplate(id: number): Promise<void> {
  const supabase = createServiceClient();

  // Primeiro busca o valor atual e depois incrementa
  const { data: templateAtual, error: selectError } = await supabase
    .from('templates')
    .select('uso_count')
    .eq('id', id)
    .single();

  if (selectError) {
    throw new Error(`Erro ao buscar uso do template: ${selectError.message}`);
  }

  const { error } = await supabase
    .from('templates')
    .update({ uso_count: (templateAtual?.uso_count ?? 0) + 1 })
    .eq('id', id);

  if (error) {
    throw new Error(`Erro ao incrementar uso do template: ${error.message}`);
  }
}

/**
 * Lista templates mais usados
 */
export async function listarTemplatesMaisUsados(
  limit = 10,
  usuario_id?: number
): Promise<TemplateComUsuario[]> {
  const supabase = createServiceClient();

  let query = supabase
    .from('templates')
    .select(`
      *,
      criador:usuarios!templates_criado_por_fkey(
        id,
        nomeCompleto,
        nomeExibicao
      )
    `);

  // Filtrar por visibilidade
  if (usuario_id) {
    query = query.or(`visibilidade.eq.publico,criado_por.eq.${usuario_id}`);
  } else {
    query = query.eq('visibilidade', 'publico');
  }

  query = query
    .order('uso_count', { ascending: false })
    .limit(limit);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao listar templates mais usados: ${error.message}`);
  }

  return (data as unknown as TemplateComUsuario[]) ?? [];
}

/**
 * Lista categorias de templates disponíveis
 */
export async function listarCategoriasTemplates(
  usuario_id?: number
): Promise<string[]> {
  const supabase = createServiceClient();

  let query = supabase
    .from('templates')
    .select('categoria');

  if (usuario_id) {
    query = query.or(`visibilidade.eq.publico,criado_por.eq.${usuario_id}`);
  } else {
    query = query.eq('visibilidade', 'publico');
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao listar categorias: ${error.message}`);
  }

  // Extrair categorias únicas, removendo nulls
  const categorias = Array.from(
    new Set(
      (data ?? [])
        .map((item) => item.categoria)
        .filter((cat): cat is string => cat !== null)
    )
  ).sort();

  return categorias;
}

/**
 * Cria um documento a partir de um template
 */
export async function criarDocumentoDeTemplate(
  template_id: number,
  usuario_id: number,
  opcoes?: {
    titulo?: string;
    pasta_id?: number | null;
  }
): Promise<{ id: number; titulo: string }> {
  const supabase = createServiceClient();

  // Buscar template
  const template = await buscarTemplatePorId(template_id);
  if (!template) {
    throw new Error('Template não encontrado');
  }

  // Definir título (usa o do template se não fornecido)
  const titulo = opcoes?.titulo || `Cópia de ${template.titulo}`;

  // Criar documento
  const { data, error } = await supabase
    .from('documentos')
    .insert({
      titulo,
      conteudo: template.conteudo,
      criado_por: usuario_id,
      editado_por: usuario_id,
      pasta_id: opcoes?.pasta_id ?? null,
    })
    .select('id, titulo')
    .single();

  if (error) {
    throw new Error(`Erro ao criar documento de template: ${error.message}`);
  }

  return data;
}

/**
 * Verifica se um usuário pode editar um template
 */
export async function verificarPermissaoTemplate(
  template_id: number,
  usuario_id: number
): Promise<boolean> {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from('templates')
    .select('criado_por')
    .eq('id', template_id)
    .single();

  if (!data) {
    return false;
  }

  return data.criado_por === usuario_id;
}
