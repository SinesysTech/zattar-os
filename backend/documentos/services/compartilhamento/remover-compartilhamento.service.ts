/**
 * Serviço de negócio para remoção de compartilhamentos
 *
 * Valida quem pode remover compartilhamentos.
 */

import {
  removerCompartilhamento as removerCompartilhamentoPersistence,
  removerCompartilhamentoPorId,
  buscarCompartilhamento,
  buscarCompartilhamentoPorId,
} from '../persistence/compartilhamento-persistence.service';
import { buscarDocumentoPorId } from '../persistence/documentos-persistence.service';

/**
 * Remove um compartilhamento por documento_id e usuario_id
 *
 * Validações:
 * - Apenas o criador do documento ou quem compartilhou pode remover
 */
export async function removerCompartilhamento(
  documentoId: number,
  usuarioId: number,
  solicitanteId: number
): Promise<void> {
  // Buscar documento
  const documento = await buscarDocumentoPorId(documentoId);
  if (!documento) {
    throw new Error('Documento não encontrado');
  }

  // Buscar compartilhamento
  const compartilhamento = await buscarCompartilhamento(documentoId, usuarioId);
  if (!compartilhamento) {
    throw new Error('Compartilhamento não encontrado');
  }

  // Validar quem pode remover:
  // 1. O criador do documento
  // 2. Quem compartilhou
  // 3. O próprio usuário que recebeu o compartilhamento
  const podRemover =
    documento.criado_por === solicitanteId ||
    compartilhamento.compartilhado_por === solicitanteId ||
    usuarioId === solicitanteId;

  if (!podRemover) {
    throw new Error('Você não tem permissão para remover este compartilhamento');
  }

  // Remover via persistência
  await removerCompartilhamentoPersistence(documentoId, usuarioId);
}

/**
 * Remove um compartilhamento por ID
 *
 * Validações:
 * - Apenas o criador do documento ou quem compartilhou pode remover
 */
export async function removerCompartilhamentoPorIdService(
  compartilhamentoId: number,
  solicitanteId: number
): Promise<void> {
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

  // Validar quem pode remover
  const podRemover =
    documento.criado_por === solicitanteId ||
    compartilhamento.compartilhado_por === solicitanteId ||
    compartilhamento.usuario_id === solicitanteId;

  if (!podRemover) {
    throw new Error('Você não tem permissão para remover este compartilhamento');
  }

  // Remover via persistência
  await removerCompartilhamentoPorId(compartilhamentoId);
}

/**
 * Remove todos os compartilhamentos de um documento
 * (Apenas o criador pode fazer isso)
 */
export async function removerTodosCompartilhamentosDocumento(
  documentoId: number,
  solicitanteId: number
): Promise<void> {
  // Buscar documento
  const documento = await buscarDocumentoPorId(documentoId);
  if (!documento) {
    throw new Error('Documento não encontrado');
  }

  // Apenas criador pode remover todos
  if (documento.criado_por !== solicitanteId) {
    throw new Error('Apenas o criador pode remover todos os compartilhamentos');
  }

  // Importar função de remover todos
  const { removerTodosCompartilhamentos } = await import(
    '../persistence/compartilhamento-persistence.service'
  );

  await removerTodosCompartilhamentos(documentoId);
}
