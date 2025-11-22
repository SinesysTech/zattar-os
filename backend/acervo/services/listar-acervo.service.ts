// Serviço de listagem de acervo
// Gerencia a lógica de negócio para listar acervo com filtros, paginação, ordenação e agrupamento

import {
  listarAcervo as listarAcervoDb,
  listarAcervoAgrupado as listarAcervoAgrupadoDb,
} from './persistence/listar-acervo.service';
import { listarAcervoUnificado as listarAcervoUnificadoDb } from './persistence/listar-acervo-unificado.service';
import type {
  ListarAcervoParams,
  ListarAcervoResult,
  ListarAcervoAgrupadoResult,
  ListarAcervoUnificadoResult,
} from '@/backend/types/acervo/types';

/**
 * Lista acervo com filtros, paginação e ordenação
 *
 * Fluxo:
 * 1. Valida parâmetros de entrada
 * 2. Aplica filtros de busca, origem, TRT, grau, responsável, etc.
 * 3. Aplica paginação
 * 4. Aplica ordenação
 * 5. Retorna lista paginada de processos
 *
 * Unificação:
 * - Se unified=true (padrão): Agrupa processos com mesmo numero_processo em um único item
 * - Se unified=false: Retorna todas as instâncias separadamente
 */
export async function obterAcervo(
  params: ListarAcervoParams = {}
): Promise<ListarAcervoResult | ListarAcervoAgrupadoResult | ListarAcervoUnificadoResult> {
  // Se agrupar_por está presente, usar função de agrupamento
  if (params.agrupar_por) {
    return listarAcervoAgrupadoDb(params as ListarAcervoParams & { agrupar_por: string });
  }

  // Se unified=true (ou não especificado, pois é o padrão), usar função de unificação
  const unified = params.unified ?? true; // Default: true
  if (unified) {
    return listarAcervoUnificadoDb(params);
  }

  // Caso contrário, usar função padrão de listagem (instâncias separadas)
  return listarAcervoDb(params);
}

