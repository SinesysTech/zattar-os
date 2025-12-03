/**
 * Serviço de negócio para listagem de compartilhamentos
 *
 * Lista compartilhamentos com informações dos usuários.
 */

import {
  listarCompartilhamentos as listarCompartilhamentosPersistence,
  listarUsuariosComAcesso,
  buscarCompartilhamento,
} from '../persistence/compartilhamento-persistence.service';
import { buscarDocumentoPorId, verificarAcessoDocumento } from '../persistence/documentos-persistence.service';
import type {
  DocumentoCompartilhadoComUsuario,
} from '@/backend/types/documentos/types';

/**
 * Lista compartilhamentos de um documento
 *
 * Apenas quem tem acesso ao documento pode ver os compartilhamentos.
 */
export async function listarCompartilhamentosDocumento(
  documentoId: number,
  solicitanteId: number
): Promise<DocumentoCompartilhadoComUsuario[]> {
  // Verificar acesso ao documento
  const { temAcesso } = await verificarAcessoDocumento(documentoId, solicitanteId);

  if (!temAcesso) {
    throw new Error('Você não tem acesso a este documento');
  }

  // Listar compartilhamentos
  return await listarCompartilhamentosPersistence({ documento_id: documentoId });
}

/**
 * Lista documentos compartilhados com um usuário
 */
export async function listarDocumentosCompartilhadosComUsuario(
  usuarioId: number
): Promise<DocumentoCompartilhadoComUsuario[]> {
  return await listarCompartilhamentosPersistence({ usuario_id: usuarioId });
}

/**
 * Lista todos os usuários que têm acesso a um documento
 * (inclui o criador e todos com compartilhamento)
 */
export async function listarTodosComAcesso(
  documentoId: number,
  solicitanteId: number
): Promise<{
  criador: { id: number; nome: string };
  compartilhados: Array<{ usuario_id: number; permissao: 'visualizar' | 'editar' }>;
}> {
  // Verificar acesso
  const { temAcesso } = await verificarAcessoDocumento(documentoId, solicitanteId);

  if (!temAcesso) {
    throw new Error('Você não tem acesso a este documento');
  }

  // Buscar documento para pegar criador
  const documento = await buscarDocumentoPorId(documentoId);
  if (!documento) {
    throw new Error('Documento não encontrado');
  }

  // Buscar compartilhamentos
  const compartilhados = await listarUsuariosComAcesso(documentoId);

  return {
    criador: {
      id: documento.criado_por,
      nome: '', // Nome seria buscado em join separado se necessário
    },
    compartilhados,
  };
}

/**
 * Verifica se um usuário específico tem acesso compartilhado a um documento
 */
export async function verificarCompartilhamento(
  documentoId: number,
  usuarioId: number
): Promise<{ compartilhado: boolean; permissao?: 'visualizar' | 'editar' }> {
  const compartilhamento = await buscarCompartilhamento(documentoId, usuarioId);

  if (!compartilhamento) {
    return { compartilhado: false };
  }

  return {
    compartilhado: true,
    permissao: compartilhamento.permissao as 'visualizar' | 'editar',
  };
}
