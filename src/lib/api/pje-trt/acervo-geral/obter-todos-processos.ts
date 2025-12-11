/**
 * Arquivo: acervo-geral/obter-todos-processos.ts
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
 *    - Valida se o campo resultado é um array e possui itens
 *    - NOTA: A API do PJE retorna qtdPaginas=0 quando há apenas 1 página de resultados
 *    - Se alguma página retornar resposta inválida, lança um erro
 * 
 * 3. Rate Limiting:
 *    - Adiciona um delay entre cada requisição de página
 *    - Delay padrão: 500ms (meio segundo)
 *    - Ajuda a evitar sobrecarregar o servidor
 * 
 * EXEMPLO DE USO:
 * const todosProcessos = await obterTodosProcessosAcervoGeral(page, 12345);
 * console.log(`Total de processos do acervo geral: ${todosProcessos.length}`);
 */

import type { Page } from 'playwright';
import type { Processo } from '@/backend/types/pje-trt/types';
import { obterProcessosAcervoGeral } from './obter-processos';

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

  // Determinar quantidade real de registros no array resultado
  const registrosNaPagina = primeiraPagina.resultado?.length || 0;

  // IMPORTANTE: A API do PJE retorna qtdPaginas=0 quando há apenas 1 página de resultados!
  // Por isso, verificamos o array resultado diretamente, não o campo qtdPaginas.
  if (!Array.isArray(primeiraPagina.resultado) || registrosNaPagina === 0) {
    return [];
  }

  // Adiciona processos da primeira página ao array final
  todosProcessos.push(...primeiraPagina.resultado);

  // Calcular total de páginas (qtdPaginas=0 significa 1 página quando há resultados)
  const qtdPaginas = primeiraPagina.qtdPaginas > 0 ? primeiraPagina.qtdPaginas : 1;
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
