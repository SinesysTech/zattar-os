/**
 * Arquivo: pendentes-manifestacao.ts
 * 
 * PROPÓSITO:
 * Este arquivo contém funções específicas para obter processos Pendentes de Manifestação do PJE TRT.
 * Processos pendentes de manifestação são processos que aguardam uma manifestação do advogado.
 * 
 * DEPENDÊNCIAS:
 * - types.ts: Importa PagedResponse, Processo, Totalizador e AgrupamentoProcessoTarefa
 * - fetch.ts: Importa fetchPJEAPI para fazer requisições HTTP
 * - playwright: Importa o tipo Page para interagir com o navegador
 * 
 * EXPORTAÇÕES:
 * - obterProcessosPendentesManifestacao(): Retorna uma página específica de processos pendentes
 * - obterTodosProcessosPendentesManifestacao(): Retorna todas as páginas de processos pendentes
 * - obterTotalizadoresPendentesManifestacao(): Retorna o totalizador específico de pendentes
 * - AgrupamentoProcessoTarefa: Enum re-exportado para facilitar imports
 * - Processo: Tipo re-exportado para facilitar imports
 * 
 * QUEM USA ESTE ARQUIVO:
 * - pendentes-manifestacao.service.ts: Importa obterTodosProcessosPendentesManifestacao, obterTotalizadoresPendentesManifestacao, AgrupamentoProcessoTarefa, Processo
 */

import type { Page } from 'playwright';
import { fetchPJEAPI } from './fetch';
import type { PagedResponse, Processo, Totalizador } from '@/backend/types/pje-trt/types';
import { AgrupamentoProcessoTarefa } from '@/backend/types/pje-trt/types';

// Re-exportar tipos para facilitar imports dos serviços
export { AgrupamentoProcessoTarefa };
export type { Processo };

/**
 * Função interna genérica para obter processos (usada por todas as funções específicas)
 * Esta função não é exportada, é apenas para uso interno deste módulo
 */
async function obterProcessos(
  page: Page,
  idAdvogado: number,
  idAgrupamento: AgrupamentoProcessoTarefa,
  pagina: number = 1,
  tamanhoPagina: number = 100,
  paramsAdicionais?: Record<string, string | number | boolean>
): Promise<PagedResponse<Processo>> {
  const params: Record<string, string | number | boolean> = {
    idAgrupamentoProcessoTarefa: idAgrupamento,
    pagina,
    tamanhoPagina,
    ...paramsAdicionais,
  };

  return fetchPJEAPI<PagedResponse<Processo>>(
    page,
    `/pje-comum-api/api/paineladvogado/${idAdvogado}/processos`,
    params
  );
}

/**
 * Função: obterProcessosPendentesManifestacao
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
 * CHAMADAS INTERNAS:
 * - obterProcessos(): Função genérica interna que faz a requisição HTTP
 * 
 * CHAMADAS EXTERNAS:
 * Esta função é chamada por:
 * - obterTodosProcessosPendentesManifestacao(): Usa obterProcessosPendentesManifestacao() internamente para buscar todas as páginas
 * - Serviços que precisam de uma página específica de processos pendentes
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
 * 
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

/**
 * Função: obterTodosProcessosPendentesManifestacao
 * 
 * PROPÓSITO:
 * Obtém TODAS as páginas de processos pendentes de manifestação automaticamente.
 * Esta função faz paginação automática internamente, chamando obterProcessosPendentesManifestacao() várias vezes
 * até obter todos os processos pendentes disponíveis.
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
 * - delayEntrePaginas: number (opcional, padrão: 500)
 *   Tipo: number
 *   Significado: Delay em milissegundos entre requisições de páginas diferentes
 *   Padrão: 500ms (meio segundo)
 *   Por que existe: Evita sobrecarregar o servidor com muitas requisições simultâneas (rate limiting)
 * 
 * - paramsAdicionais?: Record<string, string | number | boolean> (opcional)
 *   Tipo: Objeto com chaves string e valores string, number ou boolean
 *   Significado: Parâmetros adicionais específicos para processos pendentes
 *   Exemplos:
 *   - { agrupadorExpediente: 'N', tipoPainelAdvogado: 2, idPainelAdvogadoEnum: 2, ordenacaoCrescente: false }
 *   Onde agrupadorExpediente pode ser:
 *   - 'I': Expedientes sem prazo
 *   - 'N': Expedientes no prazo
 *   Comportamento: Passados para obterProcessosPendentesManifestacao() em cada chamada
 * 
 * RETORNO:
 * Tipo: Promise<Processo[]>
 * Significado: Array com TODOS os processos pendentes de todas as páginas
 * Formato: Array simples de Processo (não é paginado)
 * 
 * CHAMADAS INTERNAS:
 * - obterProcessosPendentesManifestacao(): Chamada múltiplas vezes (uma vez por página) para obter todas as páginas
 * - setTimeout(): Usado para criar delay entre requisições (rate limiting)
 * 
 * CHAMADAS EXTERNAS:
 * Esta função é chamada por:
 * - pendentes-manifestacao.service.ts: Para obter todos os processos pendentes de manifestação
 * 
 * ENDPOINT HTTP:
 * Mesmo endpoint de obterProcessosPendentesManifestacao(), mas chamado múltiplas vezes:
 * GET /pje-comum-api/api/paineladvogado/{idAdvogado}/processos?idAgrupamentoProcessoTarefa=2&pagina={pagina}&tamanhoPagina=100&{paramsAdicionais}
 * 
 * COMPORTAMENTO ESPECIAL:
 * 
 * 1. Paginação Automática:
 *    - Primeiro chama obterProcessosPendentesManifestacao() com pagina=1 para obter a primeira página
 *    - Lê o campo qtdPaginas da resposta para saber quantas páginas existem
 *    - Faz um loop de pagina=2 até qtdPaginas, chamando obterProcessosPendentesManifestacao() para cada página
 *    - Concatena todos os resultados em um único array
 * 
 * 2. Validações:
 *    - Valida se a resposta é um objeto válido
 *    - Valida se o campo resultado é um array
 *    - Se totalRegistros=0 ou qtdPaginas=0, retorna array vazio imediatamente
 *    - Se alguma página retornar resposta inválida, lança um erro
 * 
 * 3. Rate Limiting:
 *    - Adiciona um delay entre cada requisição de página
 *    - Delay padrão: 500ms (meio segundo)
 *    - Ajuda a evitar sobrecarregar o servidor
 * 
 * EXEMPLO DE USO:
 * 
 * // Obter todos os processos pendentes no prazo
 * const processosNoPrazo = await obterTodosProcessosPendentesManifestacao(page, 12345, 500, {
 *   agrupadorExpediente: 'N',
 *   tipoPainelAdvogado: 2,
 *   idPainelAdvogadoEnum: 2,
 *   ordenacaoCrescente: false
 * });
 * 
 * // Obter todos os processos pendentes sem prazo
 * const processosSemPrazo = await obterTodosProcessosPendentesManifestacao(page, 12345, 500, {
 *   agrupadorExpediente: 'I',
 *   tipoPainelAdvogado: 2,
 *   idPainelAdvogadoEnum: 2,
 *   ordenacaoCrescente: false
 * });
 */
export async function obterTodosProcessosPendentesManifestacao(
  page: Page,
  idAdvogado: number,
  delayEntrePaginas: number = 500,
  paramsAdicionais?: Record<string, string | number | boolean>
): Promise<Processo[]> {
  const todosProcessos: Processo[] = [];

  // Primeira página para obter total de páginas
  const primeiraPagina = await obterProcessosPendentesManifestacao(
    page,
    idAdvogado,
    1,
    100, // Sempre usa tamanhoPagina=100 para minimizar requisições
    paramsAdicionais
  );

  // Validar estrutura da resposta
  if (!primeiraPagina || typeof primeiraPagina !== 'object') {
    throw new Error(`Resposta inválida da API: ${JSON.stringify(primeiraPagina)}`);
  }

  // Se não há resultados, retornar array vazio imediatamente
  if (primeiraPagina.totalRegistros === 0 || primeiraPagina.qtdPaginas === 0) {
    return [];
  }

  // Validar que resultado é um array
  if (!Array.isArray(primeiraPagina.resultado)) {
    throw new Error(
      `Campo 'resultado' não é um array na resposta da API. Estrutura recebida: ${JSON.stringify(primeiraPagina, null, 2)}`
    );
  }

  // Adiciona processos da primeira página ao array final
  todosProcessos.push(...primeiraPagina.resultado);

  // Buscar páginas restantes
  const qtdPaginas = primeiraPagina.qtdPaginas || 1;
  for (let p = 2; p <= qtdPaginas; p++) {
    // Delay para rate limiting (evita sobrecarregar o servidor)
    await new Promise((resolve) => setTimeout(resolve, delayEntrePaginas));

    // Busca a página atual
    const pagina = await obterProcessosPendentesManifestacao(
      page,
      idAdvogado,
      p,
      100, // Sempre usa tamanhoPagina=100
      paramsAdicionais
    );

    // Valida resposta da página atual
    if (!pagina || !Array.isArray(pagina.resultado)) {
      throw new Error(
        `Resposta inválida na página ${p}: ${JSON.stringify(pagina)}`
      );
    }

    // Adiciona processos da página atual ao array final
    todosProcessos.push(...pagina.resultado);
  }

  return todosProcessos;
}

/**
 * Função: obterTotalizadoresPendentesManifestacao
 * 
 * PROPÓSITO:
 * Obtém o totalizador específico de Pendentes de Manifestação do painel do advogado.
 * Retorna apenas o totalizador de Pendentes de Manifestação, não todos os totalizadores.
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
 * RETORNO:
 * Tipo: Promise<Totalizador | null>
 * Significado: Totalizador de Pendentes de Manifestação ou null se não encontrado
 * 
 * CHAMADAS INTERNAS:
 * - fetchPJEAPI<Totalizador[]>(): Faz a requisição HTTP GET para o endpoint de totalizadores
 * 
 * CHAMADAS EXTERNAS:
 * Esta função é chamada por:
 * - pendentes-manifestacao.service.ts: Para validar quantidade esperada de processos
 * 
 * ENDPOINT HTTP:
 * GET /pje-comum-api/api/paineladvogado/{idAdvogado}/totalizadores?tipoPainelAdvogado=0
 * 
 * COMPORTAMENTO ESPECIAL:
 * - Busca todos os totalizadores e filtra apenas o de Pendentes de Manifestação (idAgrupamentoProcessoTarefa=2)
 * - Retorna null se o totalizador não for encontrado
 * 
 * EXEMPLO DE USO:
 * 
 * const totalizador = await obterTotalizadoresPendentesManifestacao(page, 12345);
 * if (totalizador) {
 *   console.log(`Processos pendentes de manifestação: ${totalizador.quantidadeProcessos}`);
 * }
 */
export async function obterTotalizadoresPendentesManifestacao(
  page: Page,
  idAdvogado: number
): Promise<Totalizador | null> {
  const totalizadores = await fetchPJEAPI<Totalizador[]>(
    page,
    `/pje-comum-api/api/paineladvogado/${idAdvogado}/totalizadores`,
    { tipoPainelAdvogado: 0 }
  );

  return (
    totalizadores.find(
      (t) => t.idAgrupamentoProcessoTarefa === AgrupamentoProcessoTarefa.PENDENTES_MANIFESTACAO
    ) || null
  );
}

