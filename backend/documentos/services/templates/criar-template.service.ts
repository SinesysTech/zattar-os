/**
 * Serviço de negócio para criação de templates
 *
 * Adiciona validações de negócio antes de criar templates.
 */

import {
  criarTemplate as criarTemplatePersistence,
} from '../persistence/templates-persistence.service';
import type { CriarTemplateParams, Template } from '@/backend/types/documentos/types';

/**
 * Valida os parâmetros de criação de template
 */
function validarParametros(params: CriarTemplateParams): void {
  // Validar título
  if (!params.titulo || params.titulo.trim().length === 0) {
    throw new Error('Título é obrigatório');
  }

  if (params.titulo.length > 200) {
    throw new Error('Título deve ter no máximo 200 caracteres');
  }

  // Validar conteúdo
  if (!params.conteudo) {
    throw new Error('Conteúdo é obrigatório');
  }

  // Validar visibilidade
  if (!['publico', 'privado'].includes(params.visibilidade)) {
    throw new Error('Visibilidade inválida. Use "publico" ou "privado"');
  }

  // Validar descrição (se fornecida)
  if (params.descricao && params.descricao.length > 500) {
    throw new Error('Descrição deve ter no máximo 500 caracteres');
  }

  // Validar categoria (se fornecida)
  if (params.categoria && params.categoria.length > 100) {
    throw new Error('Categoria deve ter no máximo 100 caracteres');
  }

  // Validar URL da thumbnail (se fornecida)
  if (params.thumbnail_url) {
    try {
      new URL(params.thumbnail_url);
    } catch {
      throw new Error('URL da thumbnail inválida');
    }
  }
}

/**
 * Cria um novo template
 *
 * Validações:
 * - Título obrigatório (1-200 caracteres)
 * - Conteúdo obrigatório
 * - Visibilidade válida (publico/privado)
 */
export async function criarTemplate(
  params: CriarTemplateParams,
  criadorId: number
): Promise<Template> {
  // Validar parâmetros
  validarParametros(params);

  // Normalizar título
  const paramsNormalizados: CriarTemplateParams = {
    ...params,
    titulo: params.titulo.trim(),
    descricao: params.descricao?.trim() || null,
    categoria: params.categoria?.trim() || null,
  };

  // Criar via persistência
  return await criarTemplatePersistence(paramsNormalizados, criadorId);
}

/**
 * Cria um template a partir de um documento existente
 */
export async function criarTemplateDeDocumento(
  documentoId: number,
  titulo: string,
  visibilidade: 'publico' | 'privado',
  criadorId: number,
  opcoes?: {
    descricao?: string;
    categoria?: string;
  }
): Promise<Template> {
  // Importar função de buscar documento
  const { buscarDocumentoPorId, verificarAcessoDocumento } = await import(
    '../persistence/documentos-persistence.service'
  );

  // Verificar acesso ao documento
  const { temAcesso } = await verificarAcessoDocumento(documentoId, criadorId);
  if (!temAcesso) {
    throw new Error('Você não tem acesso a este documento');
  }

  // Buscar documento
  const documento = await buscarDocumentoPorId(documentoId);
  if (!documento) {
    throw new Error('Documento não encontrado');
  }

  // Criar template com conteúdo do documento
  const params: CriarTemplateParams = {
    titulo,
    descricao: opcoes?.descricao || `Template criado a partir de "${documento.titulo}"`,
    conteudo: documento.conteudo,
    visibilidade,
    categoria: opcoes?.categoria || null,
  };

  return await criarTemplate(params, criadorId);
}
