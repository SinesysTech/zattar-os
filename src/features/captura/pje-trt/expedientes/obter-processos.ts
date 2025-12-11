/**
 * Arquivo: pendentes-manifestacao/obter-processos.ts
 * 
 * PROPÓSITO:
 * Obtém uma página específica de processos pendentes de manifestação do advogado.
 * Processos pendentes de manifestação são processos que aguardam uma manifestação do advogado.
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
 * - paramsAdicionais?: Record<string, string | number | boolean> (opcional)
 *   Tipo: Objeto com chaves string e valores string, number ou boolean
 *   Significado: Parâmetros adicionais específicos para processos pendentes
 *   Exemplos:
 *   - { agrupadorExpediente: 'N', tipoPainelAdvogado: 2, idPainelAdvogadoEnum: 2, ordenacaoCrescente: false }
 *   Onde agrupadorExpediente pode ser:
 *   - 'I': Expedientes sem prazo
 *   - 'N': Expedientes no prazo
 *   Comportamento: Se não fornecido, apenas os parâmetros padrão são usados
 * 
 * RETORNO:
 * Tipo: Promise<PagedResponse<Processo>>
 * Significado: Objeto com informações de paginação e array de processos pendentes da página solicitada
 * 
 * ENDPOINT HTTP:
 * GET /pje-comum-api/api/paineladvogado/{idAdvogado}/processos?idAgrupamentoProcessoTarefa=2&pagina={pagina}&tamanhoPagina={tamanhoPagina}&{paramsAdicionais}
 * 
 * Onde idAgrupamentoProcessoTarefa=2 identifica os Processos Pendentes de Manifestação
 * 
 * COMPORTAMENTO ESPECIAL:
 * - Parâmetros adicionais são mesclados com os parâmetros padrão
 * - Parâmetros comuns para pendentes: agrupadorExpediente ('I' ou 'N'), tipoPainelAdvogado=2, idPainelAdvogadoEnum=2, ordenacaoCrescente=false
 * 
 * EXEMPLO DE USO:
 * // Obter processos no prazo
 * const processosNoPrazo = await obterProcessosPendentesManifestacao(page, 12345, 1, 100, {
 *   agrupadorExpediente: 'N',
 *   tipoPainelAdvogado: 2,
 *   idPainelAdvogadoEnum: 2,
 *   ordenacaoCrescente: false
 * });
 * 
 * // Obter processos sem prazo
 * const processosSemPrazo = await obterProcessosPendentesManifestacao(page, 12345, 1, 100, {
 *   agrupadorExpediente: 'I',
 *   tipoPainelAdvogado: 2,
 *   idPainelAdvogadoEnum: 2,
 *   ordenacaoCrescente: false
 * });
 */

import type { Page } from 'playwright';
import type { PagedResponse, Processo } from '@/backend/types/pje-trt/types';
import { AgrupamentoProcessoTarefa } from '@/backend/types/pje-trt/types';
import { obterProcessos } from '../shared/helpers';

export async function obterProcessosPendentesManifestacao(
  page: Page,
  idAdvogado: number,
  pagina: number = 1,
  tamanhoPagina: number = 100,
  paramsAdicionais?: Record<string, string | number | boolean>
): Promise<PagedResponse<Processo>> {
  return obterProcessos(
    page,
    idAdvogado,
    AgrupamentoProcessoTarefa.PENDENTES_MANIFESTACAO,
    pagina,
    tamanhoPagina,
    paramsAdicionais
  );
}
