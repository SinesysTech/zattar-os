// Serviço de negócio para listar tipos de expedientes

import { listarTiposExpedientes as listarTiposExpedientesPersistence } from '../persistence/tipo-expediente-persistence.service';
import type { ListarTiposExpedientesParams, ListarTiposExpedientesResult } from '@/backend/types/tipos-expedientes/types';

/**
 * Listar tipos de expedientes com filtros e paginação
 */
export async function listarTiposExpedientes(
  params: ListarTiposExpedientesParams = {}
): Promise<ListarTiposExpedientesResult> {
  // Validações de negócio
  if (params.pagina !== undefined && params.pagina < 1) {
    throw new Error('Página deve ser maior que zero');
  }

  if (params.limite !== undefined && (params.limite < 1 || params.limite > 100)) {
    throw new Error('Limite deve estar entre 1 e 100');
  }

  // Chamar camada de persistência
  return await listarTiposExpedientesPersistence(params);
}

