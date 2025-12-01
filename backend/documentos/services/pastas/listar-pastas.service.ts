/**
 * Serviço de negócio para listagem de pastas
 *
 * Adiciona filtros e lógica de negócio à listagem.
 */

import {
  listarPastasComContadores,
  buscarHierarquiaPastas,
} from '../persistence/pastas-persistence.service';
import type { PastaComContadores, PastaHierarquia } from '@/backend/types/documentos/types';

export interface ListarPastasParams {
  pasta_pai_id?: number | null;
  tipo?: 'comum' | 'privada';
  incluirSubpastas?: boolean;
}

/**
 * Lista pastas com filtros
 */
export async function listarPastas(
  params: ListarPastasParams,
  usuarioId: number
): Promise<PastaComContadores[]> {
  const pastas = await listarPastasComContadores(params.pasta_pai_id, usuarioId);

  // Filtro por tipo
  if (params.tipo) {
    return pastas.filter((pasta) => pasta.tipo === params.tipo);
  }

  return pastas;
}

/**
 * Lista pastas raiz (sem pasta pai)
 */
export async function listarPastasRaiz(
  usuarioId: number
): Promise<PastaComContadores[]> {
  return listarPastasComContadores(null, usuarioId);
}

/**
 * Busca hierarquia completa de pastas a partir de uma pasta raiz
 */
export async function buscarHierarquia(
  pastaRaizId: number | null,
  incluirDocumentos: boolean,
  usuarioId: number
): Promise<PastaHierarquia[]> {
  return buscarHierarquiaPastas(pastaRaizId, incluirDocumentos, usuarioId);
}

/**
 * Busca o caminho completo de uma pasta (breadcrumb)
 */
export async function buscarCaminhoPasta(
  pastaId: number,
  usuarioId: number
): Promise<PastaComContadores[]> {
  const caminho: PastaComContadores[] = [];

  // Buscar todas as pastas para navegação
  const todasPastas = await listarPastasComContadores(undefined, usuarioId);
  const pastasMap = new Map(todasPastas.map((p) => [p.id, p]));

  let pastaAtual = pastasMap.get(pastaId);

  while (pastaAtual) {
    caminho.unshift(pastaAtual);
    if (pastaAtual.pasta_pai_id) {
      pastaAtual = pastasMap.get(pastaAtual.pasta_pai_id);
    } else {
      break;
    }
  }

  return caminho;
}
