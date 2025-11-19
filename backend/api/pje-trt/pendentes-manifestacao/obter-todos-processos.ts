/**
 * Arquivo: pendentes-manifestacao/obter-todos-processos.ts
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

import type { Page } from 'playwright';
import type { Processo } from '@/backend/types/pje-trt/types';
import { obterProcessosPendentesManifestacao } from './obter-processos';

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
