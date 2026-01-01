/**
 * Arquivo: pericias/obter-pericias.ts
 * 
 * PROPÓSITO:
 * Obtém TODAS as perícias de TODAS as situações automaticamente.
 * Esta função faz paginação automática internamente, buscando todas as páginas
 * de todas as situações (S, L, C, F, P, R) em uma única chamada.
 * 
 * PARÂMETROS:
 * - page: Page (obrigatório) - Instância da página do navegador autenticada no PJE
 * - delayEntrePaginas: number (opcional, padrão: 500) - Delay em ms entre requisições
 * 
 * RETORNO:
 * Promise<Pericia[]> - Array com TODAS as perícias de todas as páginas e todas as situações
 * 
 * COMPORTAMENTO ESPECIAL:
 * 1. Paginação Automática - Faz loop de páginas internamente
 * 2. Todas as Situações - Busca S, L, C, F, P, R em uma única requisição
 * 3. Validações - Valida estrutura da resposta e arrays
 * 4. Rate Limiting - Delay entre páginas (padrão: 500ms)
 * 5. Logging Detalhado - Registra progresso de cada página
 * 
 * SITUAÇÕES BUSCADAS:
 * - S: Aguardando Esclarecimentos
 * - L: Aguardando Laudo
 * - C: Cancelada
 * - F: Finalizada
 * - P: Laudo Juntado
 * - R: Redesignada
 * 
 * ENDPOINT HTTP:
 * GET /pje-comum-api/api/pericias?situacao=S&situacao=L&situacao=C&situacao=F&situacao=P&situacao=R&pagina={pagina}&tamanhoPagina=100
 * 
 * EXEMPLO DE USO:
 * const todasPericias = await obterPericias(page);
 * console.log(`Total de perícias: ${todasPericias.length}`);
 * 
 * // Filtrar por situação específica
 * const finalizadas = todasPericias.filter(p => p.situacao.codigo === 'F');
 * const aguardandoLaudo = todasPericias.filter(p => p.situacao.codigo === 'L');
 */

import type { Page } from 'playwright';
import type { Pericia, PagedResponse } from '../../types';

/**
 * Função auxiliar para buscar uma página específica de perícias
 * Usa fetch direto no contexto do navegador porque precisamos de múltiplos
 * parâmetros 'situacao' na query string, o que não é suportado pelo URLSearchParams
 */
async function buscarPaginaPericias(
  page: Page,
  pagina: number,
  tamanhoPagina: number = 100
): Promise<PagedResponse<Pericia>> {
  const baseUrl = await page.evaluate(() => window.location.origin);
  const endpoint = '/pje-comum-api/api/pericias';
  
  // A API espera múltiplos parâmetros situacao na query string
  // Exemplo: situacao=S&situacao=L&situacao=C&situacao=F&situacao=P&situacao=R
  const situacoes = ['S', 'L', 'C', 'F', 'P', 'R'];
  const situacoesQuery = situacoes.map(s => `situacao=${s}`).join('&');
  const url = `${baseUrl}${endpoint}?${situacoesQuery}&pagina=${pagina}&tamanhoPagina=${tamanhoPagina}`;

  console.log('🌐 [obterPericias] Chamando API:', {
    endpoint: '/pje-comum-api/api/pericias',
    pagina,
    tamanhoPagina,
    situacoes,
  });

  const response = await page.evaluate(
    async (url: string) => {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return response.json();
    },
    url
  );

  return response as PagedResponse<Pericia>;
}

/**
 * Obtém TODAS as perícias de TODAS as situações automaticamente
 * Faz paginação automática internamente
 * 
 * @param page - Instância do Playwright autenticada no PJE
 * @param delayEntrePaginas - Delay em ms entre requisições (padrão: 500)
 * @returns Array com todas as perícias de todas as páginas
 */
export async function obterPericias(
  page: Page,
  delayEntrePaginas: number = 500
): Promise<Pericia[]> {
  const todasPericias: Pericia[] = [];

  console.log('🔍 [obterPericias] Iniciando busca de perícias...', {
    situacoes: ['S', 'L', 'C', 'F', 'P', 'R'],
    delayEntrePaginas,
  });

  // Primeira página para obter total de páginas
  console.log('📄 [obterPericias] Buscando primeira página...');
  const primeiraPagina = await buscarPaginaPericias(page, 1, 100);

  // Validar estrutura da resposta
  if (!primeiraPagina || typeof primeiraPagina !== 'object') {
    console.error('❌ [obterPericias] Resposta inválida da API');
    throw new Error(`Resposta inválida da API: ${JSON.stringify(primeiraPagina)}`);
  }

  // Determinar quantidade real de registros no array resultado
  const registrosNaPagina = primeiraPagina.resultado?.length || 0;

  // IMPORTANTE: A API do PJE retorna qtdPaginas=0 quando há apenas 1 página de resultados!
  // Por isso, verificamos o array resultado diretamente, não o campo qtdPaginas.
  // Se não há campo resultado ou está vazio, não há perícias
  if (!('resultado' in primeiraPagina) || !Array.isArray(primeiraPagina.resultado) || registrosNaPagina === 0) {
    console.log('ℹ️ [obterPericias] Nenhuma perícia encontrada');
    return [];
  }

  // Calcular total de páginas (qtdPaginas=0 significa 1 página quando há resultados)
  const qtdPaginas = primeiraPagina.qtdPaginas > 0 ? primeiraPagina.qtdPaginas : 1;

  console.log(`📊 [obterPericias] Página 1/${qtdPaginas}: ${registrosNaPagina} perícias (total: ${primeiraPagina.totalRegistros})`);
  todasPericias.push(...primeiraPagina.resultado);

  // Buscar páginas restantes
  if (qtdPaginas > 1) {
    for (let p = 2; p <= qtdPaginas; p++) {
      // Delay para rate limiting (evita sobrecarregar o servidor)
      await new Promise((resolve) => setTimeout(resolve, delayEntrePaginas));

      console.log(`📄 [obterPericias] Buscando página ${p}/${qtdPaginas}...`);
      const pagina = await buscarPaginaPericias(page, p, 100);

      if (!pagina || !Array.isArray(pagina.resultado)) {
        console.error(`❌ [obterPericias] Resposta inválida na página ${p}:`, pagina);
        throw new Error(
          `Resposta inválida na página ${p}: ${JSON.stringify(pagina)}`
        );
      }

      console.log(`✅ [obterPericias] Página ${p}/${qtdPaginas}: ${pagina.resultado.length} perícias`);
      todasPericias.push(...pagina.resultado);
    }
  }

  console.log(`✅ [obterPericias] Total de perícias obtidas: ${todasPericias.length}`);
  return todasPericias;
}

