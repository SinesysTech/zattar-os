/**
 * Arquivo: audiencias/obter-pauta.ts
 * 
 * PROPÓSITO:
 * Obtém uma página específica da pauta de audiências do PJE.
 * Esta função retorna apenas uma página por vez. Para obter todas as páginas, use obterTodasAudiencias().
 * 
 * PARÂMETROS:
 * - page: Page (obrigatório) - Instância da página do navegador autenticada no PJE
 * - dataInicio: string (obrigatório) - Data inicial do período (formato: YYYY-MM-DD)
 * - dataFim: string (obrigatório) - Data final do período (formato: YYYY-MM-DD)
 * - numeroPagina: number (opcional, padrão: 1) - Número da página a ser retornada
 * - tamanhoPagina: number (opcional, padrão: 100) - Quantidade de registros por página
 * - codigoSituacao: string (opcional, padrão: 'M') - Código da situação das audiências:
 *   - 'C': Canceladas
 *   - 'M': Designadas (padrão)
 *   - 'F': Realizadas
 * - ordenacao: 'asc' | 'desc' (opcional, padrão: 'asc') - Ordenação por data
 * 
 * RETORNO:
 * Promise<PagedResponse<Audiencia>> - Objeto com informações de paginação e array de audiências
 * 
 * ENDPOINT HTTP:
 * GET /pje-comum-api/api/pauta-usuarios-externos?dataInicio={dataInicio}&dataFim={dataFim}&numeroPagina={numeroPagina}&tamanhoPagina={tamanhoPagina}&codigoSituacao={codigoSituacao}&ordenacao={ordenacao}
 * 
 * EXEMPLO DE USO:
 * const primeiraPagina = await obterPautaAudiencias(
 *   page,
 *   '2024-01-01',
 *   '2024-01-31',
 *   1,
 *   100,
 *   'M',
 *   'asc'
 * );
 */

import type { Page } from 'playwright';
import type { PagedResponse, Audiencia } from '@/backend/types/pje-trt/types';
import { fetchPJEAPI } from '../shared/fetch';

export async function obterPautaAudiencias(
  page: Page,
  dataInicio: string, // YYYY-MM-DD
  dataFim: string, // YYYY-MM-DD
  numeroPagina: number = 1,
  tamanhoPagina: number = 100,
  codigoSituacao: string = 'M', // C=Cancelada, M=Designada, F=Realizada
  ordenacao: 'asc' | 'desc' = 'asc'
): Promise<PagedResponse<Audiencia>> {
  const params = {
    dataInicio,
    dataFim,
    numeroPagina,
    tamanhoPagina,
    codigoSituacao,
    ordenacao,
  };

  console.log('🌐 [obterPautaAudiencias] Chamando API:', {
    endpoint: '/pje-comum-api/api/pauta-usuarios-externos',
    params,
  });

  try {
    const resultado = await fetchPJEAPI<PagedResponse<Audiencia>>(
      page,
      '/pje-comum-api/api/pauta-usuarios-externos',
      params
    );

    console.log('✅ [obterPautaAudiencias] Resposta recebida:', {
      pagina: resultado.pagina,
      tamanhoPagina: resultado.tamanhoPagina,
      qtdPaginas: resultado.qtdPaginas,
      totalRegistros: resultado.totalRegistros,
      resultadoLength: resultado.resultado?.length || 0,
    });

    return resultado;
  } catch (error) {
    console.error('❌ [obterPautaAudiencias] Erro na chamada da API:', error);
    throw error;
  }
}
