/**
 * Serviço de negócio para listagem de templates
 *
 * Lista templates com filtros e informações adicionais.
 */

import {
  listarTemplates as listarTemplatesPersistence,
  listarTemplatesMaisUsados,
  listarCategoriasTemplates,
  buscarTemplateComUsuario,
} from '../persistence/templates-persistence.service';
import type {
  ListarTemplatesParams,
  TemplateComUsuario,
} from '@/backend/types/documentos/types';

/**
 * Lista templates com filtros
 *
 * Aplica regras de visibilidade:
 * - Usuário logado vê públicos + seus privados
 * - Usuário anônimo vê apenas públicos
 */
export async function listarTemplates(
  params: ListarTemplatesParams,
  usuarioId?: number
): Promise<{ templates: TemplateComUsuario[]; total: number }> {
  return await listarTemplatesPersistence(params, usuarioId);
}

/**
 * Busca um template por ID com verificação de acesso
 */
export async function buscarTemplate(
  templateId: number,
  usuarioId?: number
): Promise<TemplateComUsuario> {
  const template = await buscarTemplateComUsuario(templateId);

  if (!template) {
    throw new Error('Template não encontrado');
  }

  // Verificar acesso: públicos para todos, privados apenas para o criador
  if (template.visibilidade === 'privado') {
    if (!usuarioId || template.criado_por !== usuarioId) {
      throw new Error('Você não tem acesso a este template');
    }
  }

  return template;
}

/**
 * Lista templates mais populares
 */
export async function listarPopulares(
  limit = 10,
  usuarioId?: number
): Promise<TemplateComUsuario[]> {
  return await listarTemplatesMaisUsados(limit, usuarioId);
}

/**
 * Lista categorias disponíveis
 */
export async function listarCategorias(
  usuarioId?: number
): Promise<string[]> {
  return await listarCategoriasTemplates(usuarioId);
}

/**
 * Lista templates do próprio usuário
 */
export async function listarMeusTemplates(
  usuarioId: number,
  params?: Omit<ListarTemplatesParams, 'criado_por'>
): Promise<{ templates: TemplateComUsuario[]; total: number }> {
  return await listarTemplatesPersistence(
    { ...params, criado_por: usuarioId },
    usuarioId
  );
}

/**
 * Lista templates públicos de uma categoria
 */
export async function listarPorCategoria(
  categoria: string,
  usuarioId?: number,
  params?: Omit<ListarTemplatesParams, 'categoria'>
): Promise<{ templates: TemplateComUsuario[]; total: number }> {
  return await listarTemplatesPersistence(
    { ...params, categoria, visibilidade: 'publico' },
    usuarioId
  );
}

/**
 * Busca templates por termo
 */
export async function buscarTemplates(
  termo: string,
  usuarioId?: number,
  params?: Omit<ListarTemplatesParams, 'busca'>
): Promise<{ templates: TemplateComUsuario[]; total: number }> {
  if (!termo || termo.trim().length < 2) {
    throw new Error('Termo de busca deve ter pelo menos 2 caracteres');
  }

  return await listarTemplatesPersistence(
    { ...params, busca: termo.trim() },
    usuarioId
  );
}
