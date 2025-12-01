/**
 * Serviço de negócio para mover documentos entre pastas
 *
 * Valida permissões e atualiza a pasta do documento.
 */

import {
  buscarDocumentoPorId,
  atualizarDocumento,
  verificarAcessoDocumento,
} from '../persistence/documentos-persistence.service';
import { buscarPastaPorId, verificarAcessoPasta } from '../persistence/pastas-persistence.service';
import type { Documento } from '@/backend/types/documentos/types';

export interface MoverDocumentoParams {
  documentoId: number;
  novaPastaId: number | null;
}

/**
 * Move um documento para outra pasta
 */
export async function moverDocumento(
  params: MoverDocumentoParams,
  usuarioId: number
): Promise<Documento> {
  const { documentoId, novaPastaId } = params;

  // Verificar se o documento existe
  const documento = await buscarDocumentoPorId(documentoId);
  if (!documento) {
    throw new Error('Documento não encontrado');
  }

  // Verificar se o usuário tem permissão de edição no documento
  const { temAcesso, permissao } = await verificarAcessoDocumento(documentoId, usuarioId);

  if (!temAcesso) {
    throw new Error('Você não tem acesso a este documento');
  }

  if (permissao === 'visualizar') {
    throw new Error('Você não tem permissão para mover este documento');
  }

  // Se está movendo para uma pasta, verificar acesso à pasta destino
  if (novaPastaId !== null) {
    const pastaDestino = await buscarPastaPorId(novaPastaId);

    if (!pastaDestino) {
      throw new Error('Pasta de destino não encontrada');
    }

    if (pastaDestino.deleted_at) {
      throw new Error('Pasta de destino está na lixeira');
    }

    const temAcessoPasta = await verificarAcessoPasta(novaPastaId, usuarioId);

    if (!temAcessoPasta) {
      throw new Error('Você não tem acesso à pasta de destino');
    }
  }

  // Mover documento
  return await atualizarDocumento(documentoId, { pasta_id: novaPastaId }, usuarioId);
}

/**
 * Move múltiplos documentos para outra pasta
 */
export async function moverDocumentos(
  documentoIds: number[],
  novaPastaId: number | null,
  usuarioId: number
): Promise<Documento[]> {
  const resultados: Documento[] = [];

  for (const documentoId of documentoIds) {
    try {
      const documento = await moverDocumento(
        { documentoId, novaPastaId },
        usuarioId
      );
      resultados.push(documento);
    } catch (error) {
      // Log do erro mas continua com os outros documentos
      console.error(`Erro ao mover documento ${documentoId}:`, error);
    }
  }

  return resultados;
}
