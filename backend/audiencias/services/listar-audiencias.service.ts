// Serviço de listagem de audiências
// Gerencia a lógica de negócio para listar audiências com filtros, paginação e ordenação

import { listarAudiencias as listarAudienciasDb } from './persistence/listar-audiencias.service';
import type {
  ListarAudienciasParams,
  ListarAudienciasResult,
} from '@/backend/types/audiencias/types';

/**
 * Lista audiências com filtros, paginação e ordenação
 * 
 * Fluxo:
 * 1. Valida parâmetros de entrada
 * 2. Aplica filtros de busca, TRT, grau, responsável, data, status, etc.
 * 3. Aplica paginação
 * 4. Aplica ordenação
 * 5. Retorna lista paginada de audiências
 */
export async function obterAudiencias(
  params: ListarAudienciasParams = {}
): Promise<ListarAudienciasResult> {
  return listarAudienciasDb(params);
}

