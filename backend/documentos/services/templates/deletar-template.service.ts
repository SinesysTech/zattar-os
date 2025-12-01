/**
 * Serviço de negócio para deleção de templates
 *
 * Adiciona validações de permissão antes de deletar.
 */

import {
  buscarTemplatePorId,
  deletarTemplate as deletarTemplatePersistence,
  atualizarTemplate,
} from '../persistence/templates-persistence.service';
import type { Template, AtualizarTemplateParams } from '@/backend/types/documentos/types';

/**
 * Deleta um template permanentemente
 *
 * Validações:
 * - Apenas o criador pode deletar
 */
export async function deletarTemplate(
  templateId: number,
  usuarioId: number
): Promise<void> {
  // Buscar template
  const template = await buscarTemplatePorId(templateId);
  if (!template) {
    throw new Error('Template não encontrado');
  }

  // Validar: apenas criador pode deletar
  if (template.criado_por !== usuarioId) {
    throw new Error('Apenas o criador pode deletar este template');
  }

  // Deletar via persistência
  await deletarTemplatePersistence(templateId);
}

/**
 * Atualiza um template existente
 *
 * Validações:
 * - Apenas o criador pode atualizar
 */
export async function atualizarTemplateService(
  templateId: number,
  params: AtualizarTemplateParams,
  usuarioId: number
): Promise<Template> {
  // Buscar template
  const template = await buscarTemplatePorId(templateId);
  if (!template) {
    throw new Error('Template não encontrado');
  }

  // Validar: apenas criador pode atualizar
  if (template.criado_por !== usuarioId) {
    throw new Error('Apenas o criador pode atualizar este template');
  }

  // Validações de campos
  if (params.titulo !== undefined) {
    if (!params.titulo || params.titulo.trim().length === 0) {
      throw new Error('Título não pode ser vazio');
    }
    if (params.titulo.length > 200) {
      throw new Error('Título deve ter no máximo 200 caracteres');
    }
  }

  if (params.descricao !== undefined && params.descricao && params.descricao.length > 500) {
    throw new Error('Descrição deve ter no máximo 500 caracteres');
  }

  if (params.visibilidade !== undefined && !['publico', 'privado'].includes(params.visibilidade)) {
    throw new Error('Visibilidade inválida. Use "publico" ou "privado"');
  }

  if (params.thumbnail_url !== undefined && params.thumbnail_url) {
    try {
      new URL(params.thumbnail_url);
    } catch {
      throw new Error('URL da thumbnail inválida');
    }
  }

  // Atualizar via persistência
  return await atualizarTemplate(templateId, params);
}

/**
 * Publica um template privado (torna público)
 */
export async function publicarTemplate(
  templateId: number,
  usuarioId: number
): Promise<Template> {
  return await atualizarTemplateService(
    templateId,
    { visibilidade: 'publico' },
    usuarioId
  );
}

/**
 * Torna um template público em privado
 */
export async function tornarPrivado(
  templateId: number,
  usuarioId: number
): Promise<Template> {
  return await atualizarTemplateService(
    templateId,
    { visibilidade: 'privado' },
    usuarioId
  );
}
