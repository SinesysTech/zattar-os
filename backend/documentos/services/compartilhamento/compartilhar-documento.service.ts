/**
 * Serviço de negócio para compartilhamento de documentos
 *
 * Adiciona validações de negócio antes de compartilhar.
 */

import {
  compartilharDocumento as compartilharDocumentoPersistence,
} from '../persistence/compartilhamento-persistence.service';
import { buscarDocumentoPorId } from '../persistence/documentos-persistence.service';
import { createServiceClient } from '@/backend/utils/supabase/service-client';
import type { DocumentoCompartilhado, CompartilharDocumentoParams } from '@/backend/types/documentos/types';

/**
 * Verifica se o usuário existe
 */
async function verificarUsuarioExiste(usuarioId: number): Promise<boolean> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('usuarios')
    .select('id')
    .eq('id', usuarioId)
    .single();

  return !error && !!data;
}

/**
 * Compartilha um documento com um usuário
 *
 * Validações:
 * - Apenas o criador pode compartilhar
 * - Usuário destino deve existir
 * - Não pode compartilhar consigo mesmo
 */
export async function compartilharDocumento(
  params: CompartilharDocumentoParams,
  compartilhadoPor: number
): Promise<DocumentoCompartilhado> {
  const { documento_id, usuario_id, permissao } = params;

  // Buscar documento
  const documento = await buscarDocumentoPorId(documento_id);
  if (!documento) {
    throw new Error('Documento não encontrado');
  }

  // Validar: apenas criador pode compartilhar
  if (documento.criado_por !== compartilhadoPor) {
    throw new Error('Apenas o criador do documento pode compartilhá-lo');
  }

  // Validar: não compartilhar consigo mesmo
  if (usuario_id === compartilhadoPor) {
    throw new Error('Você não pode compartilhar o documento consigo mesmo');
  }

  // Validar: usuário destino existe
  const usuarioExiste = await verificarUsuarioExiste(usuario_id);
  if (!usuarioExiste) {
    throw new Error('Usuário não encontrado');
  }

  // Validar: permissão válida
  if (!['visualizar', 'editar'].includes(permissao)) {
    throw new Error('Permissão inválida. Use "visualizar" ou "editar"');
  }

  // Compartilhar via persistência
  return await compartilharDocumentoPersistence(params, compartilhadoPor);
}

/**
 * Compartilha um documento com múltiplos usuários
 */
export async function compartilharDocumentoComMultiplos(
  documentoId: number,
  usuarioIds: number[],
  permissao: 'visualizar' | 'editar',
  compartilhadoPor: number
): Promise<DocumentoCompartilhado[]> {
  const resultados: DocumentoCompartilhado[] = [];
  const erros: { usuarioId: number; erro: string }[] = [];

  for (const usuarioId of usuarioIds) {
    try {
      const compartilhamento = await compartilharDocumento(
        { documento_id: documentoId, usuario_id: usuarioId, permissao },
        compartilhadoPor
      );
      resultados.push(compartilhamento);
    } catch (error) {
      erros.push({
        usuarioId,
        erro: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }

  if (erros.length > 0 && resultados.length === 0) {
    throw new Error(
      `Falha ao compartilhar: ${erros.map((e) => e.erro).join(', ')}`
    );
  }

  return resultados;
}
