// Serviço para listar advogados

import { listarAdvogados as listarAdvogadosPersistence } from '../persistence/advogado-persistence.service';
import type { ListarAdvogadosParams, ListarAdvogadosResult } from '@/backend/types/advogados/types';

/**
 * Listar advogados com filtros e paginação
 */
export async function listarAdvogados(
  params: ListarAdvogadosParams = {}
): Promise<ListarAdvogadosResult> {
  // Validações básicas
  if (params.pagina !== undefined && params.pagina < 1) {
    throw new Error('Página deve ser maior ou igual a 1');
  }

  if (params.limite !== undefined && (params.limite < 1 || params.limite > 100)) {
    throw new Error('Limite deve estar entre 1 e 100');
  }

  return listarAdvogadosPersistence(params);
}

