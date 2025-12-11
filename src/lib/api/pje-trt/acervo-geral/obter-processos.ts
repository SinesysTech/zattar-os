/**
 * Arquivo: acervo-geral/obter-processos.ts
 * 
 * PROPÓSITO:
 * Obtém uma página específica de processos do Acervo Geral do advogado.
 * O Acervo Geral contém todos os processos ativos do advogado.
 * 
 * PARÂMETROS:
 * - page: Page (obrigatório)
 *   Tipo: Page do Playwright
 *   Significado: Instância da página do navegador autenticada no PJE
 * 
 * - idAdvogado: number (obrigatório)
 *   Tipo: number
 *   Significado: ID do advogado no sistema PJE
 *   Como obter: Extraído do JWT após autenticação (campo idAdvogado)
 * 
 * - pagina: number (opcional, padrão: 1)
 *   Tipo: number
 *   Significado: Número da página a ser retornada (começa em 1)
 *   Padrão: 1 (primeira página)
 * 
 * - tamanhoPagina: number (opcional, padrão: 100)
 *   Tipo: number
 *   Significado: Quantidade de registros por página
 *   Padrão: 100
 * 
 * RETORNO:
 * Tipo: Promise<PagedResponse<Processo>>
 * Significado: Objeto com informações de paginação e array de processos do acervo geral da página solicitada
 * 
 * ENDPOINT HTTP:
 * GET /pje-comum-api/api/paineladvogado/{idAdvogado}/processos?idAgrupamentoProcessoTarefa=1&pagina={pagina}&tamanhoPagina={tamanhoPagina}
 * 
 * Onde idAgrupamentoProcessoTarefa=1 identifica o Acervo Geral
 * 
 * EXEMPLO DE USO:
 * const primeiraPagina = await obterProcessosAcervoGeral(page, 12345, 1, 100);
 * console.log(`Total de processos: ${primeiraPagina.totalRegistros}`);
 */

import type { Page } from 'playwright';
import type { PagedResponse, Processo } from '@/backend/types/pje-trt/types';
import { AgrupamentoProcessoTarefa } from '@/backend/types/pje-trt/types';
import { obterProcessos } from '../shared/helpers';

export async function obterProcessosAcervoGeral(
  page: Page,
  idAdvogado: number,
  pagina: number = 1,
  tamanhoPagina: number = 100
): Promise<PagedResponse<Processo>> {
  return obterProcessos(
    page,
    idAdvogado,
    AgrupamentoProcessoTarefa.ACERVO_GERAL,
    pagina,
    tamanhoPagina
  );
}
