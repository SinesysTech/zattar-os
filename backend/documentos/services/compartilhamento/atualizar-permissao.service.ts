/**
 * Serviço de negócio para atualização de permissões de compartilhamento
 *
 * Valida quem pode alterar permissões.
 */

import {
  atualizarPermissaoCompartilhamento,
  atualizarPermissaoCompartilhamentoPorId,
  buscarCompartilhamento,
  buscarCompartilhamentoPorId,
} from '../persistence/compartilhamento-persistence.service';
import { buscarDocumentoPorId } from '../persistence/documentos-persistence.service';
import type { DocumentoCompartilhado } from '@/backend/types/documentos/types';

/**
 * Atualiza a permissão de um compartilhamento
 *
 * Validações:
 * - Apenas o criador do documento pode alterar permissões
 */
export async function atualizarPermissao(
  documentoId: number,
  usuarioId: number,
  novaPermissao: 'visualizar' | 'editar',
  solicitanteId: number
): Promise<DocumentoCompartilhado> {
  // Buscar documento
  const documento = await buscarDocumentoPorId(documentoId);
  if (!documento) {
    throw new Error('Documento não encontrado');
  }

  // Validar: apenas criador pode alterar permissões
  if (documento.criado_por !== solicitanteId) {
    throw new Error('Apenas o criador do documento pode alterar permissões');
  }

  // Buscar compartilhamento existente
  const compartilhamento = await buscarCompartilhamento(documentoId, usuarioId);
  if (!compartilhamento) {
    throw new Error('Compartilhamento não encontrado');
  }

  // Validar permissão
  if (!['visualizar', 'editar'].includes(novaPermissao)) {
    throw new Error('Permissão inválida. Use "visualizar" ou "editar"');
  }

  // Se a permissão é a mesma, não faz nada
  if (compartilhamento.permissao === novaPermissao) {
    return compartilhamento;
  }

  // Atualizar via persistência
  return await atualizarPermissaoCompartilhamento(documentoId, usuarioId, novaPermissao);
}

/**
 * Atualiza a permissão de um compartilhamento por ID
 *
 * Validações:
 * - Apenas o criador do documento pode alterar permissões
 */
export async function atualizarPermissaoPorId(
  compartilhamentoId: number,
  novaPermissao: 'visualizar' | 'editar',
  solicitanteId: number
): Promise<DocumentoCompartilhado> {
  // Buscar compartilhamento
  const compartilhamento = await buscarCompartilhamentoPorId(compartilhamentoId);
  if (!compartilhamento) {
    throw new Error('Compartilhamento não encontrado');
  }

  // Buscar documento
  const documento = await buscarDocumentoPorId(compartilhamento.documento_id);
  if (!documento) {
    throw new Error('Documento não encontrado');
  }

  // Validar: apenas criador pode alterar permissões
  if (documento.criado_por !== solicitanteId) {
    throw new Error('Apenas o criador do documento pode alterar permissões');
  }

  // Validar permissão
  if (!['visualizar', 'editar'].includes(novaPermissao)) {
    throw new Error('Permissão inválida. Use "visualizar" ou "editar"');
  }

  // Se a permissão é a mesma, não faz nada
  if (compartilhamento.permissao === novaPermissao) {
    return compartilhamento;
  }

  // Atualizar via persistência
  return await atualizarPermissaoCompartilhamentoPorId(compartilhamentoId, novaPermissao);
}

/**
 * Promove um usuário de visualizar para editar
 */
export async function promoverParaEditor(
  documentoId: number,
  usuarioId: number,
  solicitanteId: number
): Promise<DocumentoCompartilhado> {
  return atualizarPermissao(documentoId, usuarioId, 'editar', solicitanteId);
}

/**
 * Rebaixa um usuário de editar para visualizar
 */
export async function rebaixarParaVisualizador(
  documentoId: number,
  usuarioId: number,
  solicitanteId: number
): Promise<DocumentoCompartilhado> {
  return atualizarPermissao(documentoId, usuarioId, 'visualizar', solicitanteId);
}
