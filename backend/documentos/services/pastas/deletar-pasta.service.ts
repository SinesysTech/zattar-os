/**
 * Serviço de negócio para deleção de pastas
 *
 * Implementa soft delete e opções para documentos órfãos.
 */

import {
  deletarPasta as deletarPastaPersistence,
  buscarPastaPorId,
  listarPastasComContadores,
} from '../persistence/pastas-persistence.service';
import {
  listarDocumentos,
  atualizarDocumento,
  deletarDocumento,
} from '../persistence/documentos-persistence.service';
import type { Pasta } from '@/backend/types/documentos/types';

export type AcaoDocumentosOrfaos = 'mover_raiz' | 'deletar' | 'erro';

export interface DeletarPastaParams {
  pastaId: number;
  acaoDocumentosOrfaos?: AcaoDocumentosOrfaos;
}

export interface ResultadoDeletar {
  pasta: Pasta;
  documentosMovidos: number;
  documentosDeletados: number;
  subpastasDeletadas: number;
}

/**
 * Deleta uma pasta (soft delete)
 *
 * @param params Parâmetros de deleção
 * @param usuarioId ID do usuário que está deletando
 * @param acaoDocumentosOrfaos O que fazer com documentos órfãos:
 *   - 'mover_raiz': Move documentos para a raiz
 *   - 'deletar': Deleta documentos junto com a pasta
 *   - 'erro': Retorna erro se houver documentos
 */
export async function deletarPasta(
  params: DeletarPastaParams,
  usuarioId: number
): Promise<ResultadoDeletar> {
  const { pastaId, acaoDocumentosOrfaos = 'mover_raiz' } = params;

  // Verificar se a pasta existe
  const pasta = await buscarPastaPorId(pastaId);
  if (!pasta) {
    throw new Error('Pasta não encontrada');
  }

  // Verificar se o usuário é o criador
  if (pasta.criado_por !== usuarioId) {
    throw new Error('Apenas o criador pode deletar a pasta');
  }

  // Verificar se a pasta já está deletada
  if (pasta.deleted_at) {
    throw new Error('Pasta já está na lixeira');
  }

  let documentosMovidos = 0;
  let documentosDeletados = 0;
  let subpastasDeletadas = 0;

  // Buscar documentos na pasta
  const documentosNaPasta = await listarDocumentos({ pasta_id: pastaId });

  // Tratar documentos órfãos
  if (documentosNaPasta.documentos.length > 0) {
    switch (acaoDocumentosOrfaos) {
      case 'erro':
        throw new Error(
          `Pasta contém ${documentosNaPasta.documentos.length} documento(s). Mova-os antes de deletar.`
        );

      case 'mover_raiz':
        // Mover documentos para a raiz
        for (const doc of documentosNaPasta.documentos) {
          await atualizarDocumento(doc.id, { pasta_id: null }, usuarioId);
          documentosMovidos++;
        }
        break;

      case 'deletar':
        // Deletar documentos
        for (const doc of documentosNaPasta.documentos) {
          await deletarDocumento(doc.id);
          documentosDeletados++;
        }
        break;
    }
  }

  // Buscar subpastas
  const subpastas = await listarPastasComContadores(pastaId, usuarioId);

  // Deletar subpastas recursivamente
  for (const subpasta of subpastas) {
    await deletarPasta(
      { pastaId: subpasta.id, acaoDocumentosOrfaos },
      usuarioId
    );
    subpastasDeletadas++;
  }

  // Deletar a pasta (soft delete)
  await deletarPastaPersistence(pastaId);

  return {
    pasta: { ...pasta, deleted_at: new Date().toISOString() },
    documentosMovidos,
    documentosDeletados,
    subpastasDeletadas,
  };
}

/**
 * Verifica se é seguro deletar a pasta (não tem documentos ou subpastas)
 */
export async function verificarSeguroDeletar(
  pastaId: number,
  usuarioId: number
): Promise<{ seguro: boolean; documentos: number; subpastas: number }> {
  const resultado = await listarDocumentos({ pasta_id: pastaId });
  const subpastas = await listarPastasComContadores(pastaId, usuarioId);

  return {
    seguro: resultado.total === 0 && subpastas.length === 0,
    documentos: resultado.total,
    subpastas: subpastas.length,
  };
}
