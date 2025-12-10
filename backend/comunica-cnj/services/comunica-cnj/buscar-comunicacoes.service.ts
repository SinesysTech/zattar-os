/**
 * Serviço de busca de comunicações CNJ
 * Busca direta na API (sem persistência)
 * 
 * ⚠️ SERVIÇO LEGADO - DEPRECATED ⚠️
 * 
 * Este serviço está sendo substituído por `src/core/comunica-cnj/service.ts`.
 * 
 * **MIGRE PARA:**
 * - `buscarComunicacoes()` em `@/core/comunica-cnj`
 * 
 * @deprecated Use `src/core/comunica-cnj` para novas integrações
 */

import { getComunicaCNJClient } from '../../client/comunica-cnj-client';
import type {
  ComunicacaoAPIParams,
  ComunicacaoAPIResponse,
  RateLimitStatus,
} from '../../types/types';

/**
 * Busca comunicações na API do CNJ (sem persistir)
 * Usado para busca manual pelo usuário
 *
 * @param params - Parâmetros de busca
 * @returns Resposta da API e status de rate limit
 */
export async function buscarComunicacoes(params: ComunicacaoAPIParams): Promise<{
  data: ComunicacaoAPIResponse;
  rateLimit: RateLimitStatus;
}> {
  const client = getComunicaCNJClient();

  console.log('[buscar-comunicacoes] Buscando comunicações:', params);

  const result = await client.consultarComunicacoes(params);

  console.log('[buscar-comunicacoes] Resultado:', {
    total: result.data.paginacao.total,
    comunicacoes: result.data.comunicacoes.length,
  });

  return result;
}

/**
 * Busca comunicações por OAB
 *
 * @param numeroOab - Número da OAB
 * @param ufOab - UF da OAB
 * @param pagina - Página
 * @returns Resultado da busca
 */
export async function buscarComunicacoesPorOab(
  numeroOab: string,
  ufOab: string,
  pagina = 1
): Promise<{
  data: ComunicacaoAPIResponse;
  rateLimit: RateLimitStatus;
}> {
  return buscarComunicacoes({
    numeroOab,
    ufOab,
    pagina,
    itensPorPagina: 100,
  });
}

/**
 * Busca comunicações por número de processo
 *
 * @param numeroProcesso - Número do processo
 * @param pagina - Página
 * @returns Resultado da busca
 */
export async function buscarComunicacoesPorProcesso(
  numeroProcesso: string,
  pagina = 1
): Promise<{
  data: ComunicacaoAPIResponse;
  rateLimit: RateLimitStatus;
}> {
  return buscarComunicacoes({
    numeroProcesso,
    pagina,
    itensPorPagina: 100,
  });
}

/**
 * Busca comunicações por tribunal e data
 *
 * @param siglaTribunal - Sigla do tribunal
 * @param dataInicio - Data início
 * @param dataFim - Data fim
 * @param pagina - Página
 * @returns Resultado da busca
 */
export async function buscarComunicacoesPorTribunalData(
  siglaTribunal: string,
  dataInicio: string,
  dataFim: string,
  pagina = 1
): Promise<{
  data: ComunicacaoAPIResponse;
  rateLimit: RateLimitStatus;
}> {
  return buscarComunicacoes({
    siglaTribunal,
    dataInicio,
    dataFim,
    pagina,
    itensPorPagina: 100,
  });
}

/**
 * Obtém status atual do rate limit
 *
 * @returns Status do rate limit
 */
export function obterStatusRateLimit(): RateLimitStatus {
  const client = getComunicaCNJClient();
  return client.getRateLimitStatus();
}
