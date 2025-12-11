/**
 * Arquivo: arquivados/obter-processos.ts
 * 
 * PROPÓSITO:
 * Obtém uma página específica de processos arquivados do advogado.
 * Processos arquivados são processos que foram finalizados e arquivados pelo tribunal.
 * 
 * PARÂMETROS:
 * - page: Page (obrigatório) - Instância da página do navegador autenticada no PJE
 * - idAdvogado: number (obrigatório) - ID do advogado no sistema PJE
 * - pagina: number (opcional, padrão: 1) - Número da página a ser retornada
 * - tamanhoPagina: number (opcional, padrão: 100) - Quantidade de registros por página
 * - paramsAdicionais?: Record<string, string | number | boolean> (opcional) - Parâmetros adicionais
 *   Exemplos:
 *   - { tipoPainelAdvogado: 5, ordenacaoCrescente: false, data: Date.now() }
 * 
 * RETORNO:
 * Promise<PagedResponse<Processo>> - Objeto com informações de paginação e array de processos arquivados
 * 
 * ENDPOINT HTTP:
 * GET /pje-comum-api/api/paineladvogado/{idAdvogado}/processos?idAgrupamentoProcessoTarefa=5&pagina={pagina}&tamanhoPagina={tamanhoPagina}&{paramsAdicionais}
 * 
 * Onde idAgrupamentoProcessoTarefa=5 identifica os Processos Arquivados
 * 
 * COMPORTAMENTO ESPECIAL:
 * - Parâmetros adicionais são mesclados com os parâmetros padrão
 * - Parâmetros comuns para arquivados: tipoPainelAdvogado=5, ordenacaoCrescente=false, data=timestamp
 * 
 * EXEMPLO DE USO:
 * const primeiraPagina = await obterProcessosArquivados(page, 12345, 1, 100, {
 *   tipoPainelAdvogado: 5,
 *   ordenacaoCrescente: false,
 *   data: Date.now()
 * });
 */

import type { Page } from 'playwright';
import type { PagedResponse, Processo } from '@/backend/types/pje-trt/types';
import { AgrupamentoProcessoTarefa } from '@/backend/types/pje-trt/types';
import { obterProcessos } from '../shared/helpers';

export async function obterProcessosArquivados(
  page: Page,
  idAdvogado: number,
  pagina: number = 1,
  tamanhoPagina: number = 100,
  paramsAdicionais?: Record<string, string | number | boolean>
): Promise<PagedResponse<Processo>> {
  return obterProcessos(
    page,
    idAdvogado,
    AgrupamentoProcessoTarefa.ARQUIVADOS,
    pagina,
    tamanhoPagina,
    paramsAdicionais
  );
}
