/**
 * Serviço de negócio para uso de templates
 *
 * Cria documentos a partir de templates com validações.
 */

import {
  buscarTemplatePorId,
  incrementarUsoTemplate,
  criarDocumentoDeTemplate,
} from '../persistence/templates-persistence.service';
import type { Template } from '@/backend/types/documentos/types';

/**
 * Usa um template para criar um novo documento
 *
 * Validações:
 * - Template deve existir
 * - Usuário deve ter acesso (públicos ou privados próprios)
 * - Incrementa contador de uso
 */
export async function usarTemplate(
  templateId: number,
  usuarioId: number,
  opcoes?: {
    titulo?: string;
    pasta_id?: number | null;
  }
): Promise<{ id: number; titulo: string }> {
  // Buscar template
  const template = await buscarTemplatePorId(templateId);
  if (!template) {
    throw new Error('Template não encontrado');
  }

  // Verificar acesso
  if (template.visibilidade === 'privado' && template.criado_por !== usuarioId) {
    throw new Error('Você não tem acesso a este template');
  }

  // Validar título customizado (se fornecido)
  if (opcoes?.titulo) {
    if (opcoes.titulo.trim().length === 0) {
      throw new Error('Título não pode ser vazio');
    }
    if (opcoes.titulo.length > 200) {
      throw new Error('Título deve ter no máximo 200 caracteres');
    }
  }

  // Verificar acesso à pasta destino (se fornecida)
  if (opcoes?.pasta_id) {
    const { buscarPastaPorId, verificarAcessoPasta } = await import(
      '../persistence/pastas-persistence.service'
    );

    const pasta = await buscarPastaPorId(opcoes.pasta_id);
    if (!pasta || pasta.deleted_at) {
      throw new Error('Pasta de destino não encontrada');
    }

    const temAcesso = await verificarAcessoPasta(opcoes.pasta_id, usuarioId);
    if (!temAcesso) {
      throw new Error('Você não tem acesso à pasta de destino');
    }
  }

  // Criar documento a partir do template
  const documento = await criarDocumentoDeTemplate(templateId, usuarioId, opcoes);

  // Incrementar contador de uso (fire-and-forget)
  incrementarUsoTemplate(templateId).catch((error) => {
    console.error('Erro ao incrementar uso do template:', error);
  });

  return documento;
}

/**
 * Pré-visualiza um template (retorna apenas o conteúdo)
 */
export async function preVisualizarTemplate(
  templateId: number,
  usuarioId?: number
): Promise<Pick<Template, 'id' | 'titulo' | 'descricao' | 'conteudo' | 'categoria'>> {
  const template = await buscarTemplatePorId(templateId);

  if (!template) {
    throw new Error('Template não encontrado');
  }

  // Verificar acesso
  if (template.visibilidade === 'privado') {
    if (!usuarioId || template.criado_por !== usuarioId) {
      throw new Error('Você não tem acesso a este template');
    }
  }

  return {
    id: template.id,
    titulo: template.titulo,
    descricao: template.descricao,
    conteudo: template.conteudo,
    categoria: template.categoria,
  };
}

/**
 * Duplica um template existente
 */
export async function duplicarTemplate(
  templateId: number,
  usuarioId: number,
  novoTitulo?: string
): Promise<Template> {
  // Buscar template original
  const templateOriginal = await buscarTemplatePorId(templateId);
  if (!templateOriginal) {
    throw new Error('Template não encontrado');
  }

  // Verificar acesso
  if (templateOriginal.visibilidade === 'privado' && templateOriginal.criado_por !== usuarioId) {
    throw new Error('Você não tem acesso a este template');
  }

  // Importar função de criar template
  const { criarTemplate } = await import('./criar-template.service');

  // Criar cópia do template
  const titulo = novoTitulo || `Cópia de ${templateOriginal.titulo}`;

  return await criarTemplate(
    {
      titulo,
      descricao: templateOriginal.descricao,
      conteudo: templateOriginal.conteudo,
      visibilidade: 'privado', // Cópia sempre começa como privada
      categoria: templateOriginal.categoria,
      thumbnail_url: templateOriginal.thumbnail_url,
    },
    usuarioId
  );
}
