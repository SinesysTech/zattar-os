/**
 * Arquivo: acervo-geral.ts
 * 
 * PROPÓSITO:
 * Este arquivo contém funções específicas para obter processos do Acervo Geral do PJE TRT.
 * O Acervo Geral representa todos os processos ativos do advogado.
 * 
 * DEPENDÊNCIAS:
 * - types.ts: Importa PagedResponse, Processo e AgrupamentoProcessoTarefa
 * - fetch.ts: Importa fetchPJEAPI para fazer requisições HTTP
 * - processos.ts: Importa funções genéricas internas obterProcessos e obterTodosProcessos
 * - playwright: Importa o tipo Page para interagir com o navegador
 * 
 * EXPORTAÇÕES:
 * - obterProcessosAcervoGeral(): Retorna uma página específica de processos do acervo geral
 * - obterTodosProcessosAcervoGeral(): Retorna todas as páginas de processos do acervo geral
 * - obterTotalizadoresAcervoGeral(): Retorna o totalizador específico do acervo geral
 * - AgrupamentoProcessoTarefa: Enum re-exportado para facilitar imports
 * - Processo: Tipo re-exportado para facilitar imports
 * 
 * QUEM USA ESTE ARQUIVO:
 * - acervo-geral.service.ts: Importa obterTodosProcessosAcervoGeral, obterTotalizadoresAcervoGeral, AgrupamentoProcessoTarefa, Processo
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
 * Função: obterProcessosAcervoGeral
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
 * CHAMADAS INTERNAS:
 * - obterProcessos(): Função genérica interna que faz a requisição HTTP
 * 
 * CHAMADAS EXTERNAS:
 * Esta função é chamada por:
 * - obterTodosProcessosAcervoGeral(): Usa obterProcessosAcervoGeral() internamente para buscar todas as páginas
 * - Serviços que precisam de uma página específica do acervo geral
 * 
 * ENDPOINT HTTP:
 * GET /pje-comum-api/api/paineladvogado/{idAdvogado}/processos?idAgrupamentoProcessoTarefa=1&pagina={pagina}&tamanhoPagina={tamanhoPagina}
 * 
 * Onde idAgrupamentoProcessoTarefa=1 identifica o Acervo Geral
 * 
 * EXEMPLO DE USO:
 * 
 * const primeiraPagina = await obterProcessosAcervoGeral(page, 12345, 1, 100);
 * console.log(`Total de processos: ${primeiraPagina.totalRegistros}`);
 */
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

/**
 * Função: obterTodosProcessosAcervoGeral
 * 
 * PROPÓSITO:
 * Obtém TODAS as páginas de processos do Acervo Geral automaticamente.
 * Esta função faz paginação automática internamente, chamando obterProcessosAcervoGeral() várias vezes
 * até obter todos os processos disponíveis do acervo geral.
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
 * RETORNO:
 * Tipo: Promise<Processo[]>
 * Significado: Array com TODOS os processos do acervo geral de todas as páginas
 * Formato: Array simples de Processo (não é paginado)
 * 
 * CHAMADAS INTERNAS:
 * - obterProcessosAcervoGeral(): Chamada múltiplas vezes (uma vez por página) para obter todas as páginas
 * - setTimeout(): Usado para criar delay entre requisições (rate limiting)
 * 
 * CHAMADAS EXTERNAS:
 * Esta função é chamada por:
 * - acervo-geral.service.ts: Para obter todos os processos do acervo geral
 * 
 * ENDPOINT HTTP:
 * Mesmo endpoint de obterProcessosAcervoGeral(), mas chamado múltiplas vezes:
 * GET /pje-comum-api/api/paineladvogado/{idAdvogado}/processos?idAgrupamentoProcessoTarefa=1&pagina={pagina}&tamanhoPagina=100
 * 
 * COMPORTAMENTO ESPECIAL:
 * 
 * 1. Paginação Automática:
 *    - Primeiro chama obterProcessosAcervoGeral() com pagina=1 para obter a primeira página
 *    - Lê o campo qtdPaginas da resposta para saber quantas páginas existem
 *    - Faz um loop de pagina=2 até qtdPaginas, chamando obterProcessosAcervoGeral() para cada página
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
 * const todosProcessos = await obterTodosProcessosAcervoGeral(page, 12345);
 * console.log(`Total de processos do acervo geral: ${todosProcessos.length}`);
 */
export async function obterTodosProcessosAcervoGeral(
  page: Page,
  idAdvogado: number,
  delayEntrePaginas: number = 500
): Promise<Processo[]> {
  const todosProcessos: Processo[] = [];

  // Primeira página para obter total de páginas
  const primeiraPagina = await obterProcessosAcervoGeral(
    page,
    idAdvogado,
    1,
    100 // Sempre usa tamanhoPagina=100 para minimizar requisições
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
    const pagina = await obterProcessosAcervoGeral(
      page,
      idAdvogado,
      p,
      100 // Sempre usa tamanhoPagina=100
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
 * Função: obterTotalizadoresAcervoGeral
 * 
 * PROPÓSITO:
 * Obtém o totalizador específico do Acervo Geral do painel do advogado.
 * Retorna apenas o totalizador do Acervo Geral, não todos os totalizadores.
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
 * Significado: Totalizador do Acervo Geral ou null se não encontrado
 * 
 * CHAMADAS INTERNAS:
 * - fetchPJEAPI<Totalizador[]>(): Faz a requisição HTTP GET para o endpoint de totalizadores
 * 
 * CHAMADAS EXTERNAS:
 * Esta função é chamada por:
 * - acervo-geral.service.ts: Para validar quantidade esperada de processos
 * 
 * ENDPOINT HTTP:
 * GET /pje-comum-api/api/paineladvogado/{idAdvogado}/totalizadores?tipoPainelAdvogado=0
 * 
 * COMPORTAMENTO ESPECIAL:
 * - Busca todos os totalizadores e filtra apenas o do Acervo Geral (idAgrupamentoProcessoTarefa=1)
 * - Retorna null se o totalizador não for encontrado
 * 
 * EXEMPLO DE USO:
 * 
 * const totalizador = await obterTotalizadoresAcervoGeral(page, 12345);
 * if (totalizador) {
 *   console.log(`Processos no acervo geral: ${totalizador.quantidadeProcessos}`);
 * }
 */
export async function obterTotalizadoresAcervoGeral(
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
      (t) => t.idAgrupamentoProcessoTarefa === AgrupamentoProcessoTarefa.ACERVO_GERAL
    ) || null
  );
}

