/**
 * Arquivo: shared/fetch.ts
 * 
 * PROPÓSITO:
 * Este arquivo contém a função auxiliar genérica fetchPJEAPI que realiza requisições HTTP GET
 * para a API do PJE usando cookies de sessão para autenticação.
 * 
 * IMPORTANTE:
 * Esta função NÃO usa Authorization header, pois o PJE utiliza autenticação baseada em cookies.
 * Tentar usar Authorization header causa erro 401 (não autorizado).
 * 
 * DEPENDÊNCIAS:
 * - playwright: Importa o tipo Page do Playwright para executar código JavaScript no contexto do navegador
 * 
 * EXPORTAÇÕES:
 * - fetchPJEAPI<T>(): Função genérica para fazer requisições GET à API do PJE
 * 
 * QUEM USA ESTE ARQUIVO:
 * - Todas as APIs do PJE (acervo-geral, pendentes-manifestacao, audiencias, arquivados)
 */

import type { Page } from 'playwright';

/**
 * Função: fetchPJEAPI<T>
 * 
 * PROPÓSITO:
 * Faz uma requisição HTTP GET para a API do PJE usando cookies de sessão para autenticação.
 * Esta é a função base utilizada por todas as outras funções de API do PJE.
 * 
 * IMPORTANTE:
 * - Usa cookies automaticamente através de credentials: 'include'
 * - NÃO usa Authorization header (causa erro 401 se usado)
 * - Executa o fetch dentro do contexto do navegador Playwright para ter acesso aos cookies
 * 
 * PARÂMETROS:
 * - page: Page (obrigatório)
 *   Tipo: Page do Playwright
 *   Significado: Instância da página do navegador que contém os cookies de autenticação do PJE
 *   Por que é necessário: Os cookies de autenticação estão no contexto do navegador, então precisamos
 *   executar o fetch dentro desse contexto para que os cookies sejam enviados automaticamente
 * 
 * - endpoint: string (obrigatório)
 *   Tipo: string
 *   Significado: Caminho do endpoint da API (ex: "/pje-comum-api/api/paineladvogado/123/processos")
 *   Formato: Deve começar com "/" e conter o caminho completo do endpoint
 *   Exemplos:
 *   - "/pje-comum-api/api/paineladvogado/123/totalizadores"
 *   - "/pje-comum-api/api/paineladvogado/123/processos"
 *   - "/pje-comum-api/api/pauta-usuarios-externos"
 * 
 * - params?: Record<string, string | number | boolean> (opcional)
 *   Tipo: Objeto com chaves string e valores string, number ou boolean
 *   Significado: Parâmetros de query string a serem adicionados à URL
 *   Formato: { chave: valor, ... }
 *   Exemplos:
 *   - { pagina: 1, tamanhoPagina: 100 }
 *   - { idAgrupamentoProcessoTarefa: 1, tipoPainelAdvogado: 0 }
 *   - { dataInicio: "2024-01-01", dataFim: "2024-12-31" }
 *   Comportamento: Se não fornecido, a URL não terá parâmetros de query
 * 
 * RETORNO:
 * Tipo: Promise<T>
 * Significado: Promise que resolve com o resultado da API tipado como T
 * Formato: O tipo T é inferido pelo TypeScript baseado no uso da função
 * Exemplos:
 * - fetchPJEAPI<Totalizador[]> retorna Promise<Totalizador[]>
 * - fetchPJEAPI<PagedResponse<Processo>> retorna Promise<PagedResponse<Processo>>
 * - fetchPJEAPI<PagedResponse<Audiencia>> retorna Promise<PagedResponse<Audiencia>>
 * 
 * CHAMADAS INTERNAS:
 * - page.evaluate(): Executa código JavaScript no contexto do navegador
 * - window.location.origin: Obtém a origem da URL atual (ex: "https://pje.trt3.jus.br")
 * - URLSearchParams: Constrói a query string a partir dos parâmetros
 * - fetch(): Faz a requisição HTTP GET dentro do contexto do navegador
 * 
 * ENDPOINT HTTP:
 * Não há um endpoint fixo. A URL completa é construída dinamicamente:
 * - Base: Obtida de window.location.origin (ex: "https://pje.trt3.jus.br")
 * - Endpoint: Fornecido como parâmetro (ex: "/pje-comum-api/api/paineladvogado/123/processos")
 * - Query params: Adicionados se fornecidos no parâmetro params
 * 
 * Exemplo de URL final:
 * "https://pje.trt3.jus.br/pje-comum-api/api/paineladvogado/123/processos?idAgrupamentoProcessoTarefa=1&pagina=1&tamanhoPagina=100"
 * 
 * COMPORTAMENTO ESPECIAL:
 * 
 * 1. Autenticação via Cookies:
 *    - Usa credentials: 'include' para enviar cookies automaticamente
 *    - Os cookies são gerenciados pelo navegador Playwright
 *    - Não precisa extrair ou passar cookies manualmente
 * 
 * 2. XSRF Token:
 *    - Atualmente não é usado (xsrfToken: undefined)
 *    - Há um TODO para extrair do cookie se necessário no futuro
 *    - Se implementado, será adicionado no header X-XSRF-Token
 * 
 * 3. Tratamento de Erros:
 *    - Se a resposta HTTP não for ok (status >= 400), lança um Error
 *    - O erro contém o status HTTP e o texto da resposta
 *    - Formato do erro: "HTTP {status}: {texto da resposta}"
 * 
 * 4. Headers:
 *    - Accept: 'application/json' - Indica que esperamos JSON
 *    - Content-Type: 'application/json' - Indica que enviamos JSON (mesmo sendo GET)
 * 
 * 5. Conversão de Tipos:
 *    - Todos os valores dos parâmetros são convertidos para string antes de serem adicionados à query string
 *    - Isso garante compatibilidade com URLSearchParams
 * 
 * EXEMPLO DE USO:
 * 
 * // Obter totalizadores
 * const totalizadores = await fetchPJEAPI<Totalizador[]>(
 *   page,
 *   `/pje-comum-api/api/paineladvogado/${idAdvogado}/totalizadores`,
 *   { tipoPainelAdvogado: 0 }
 * );
 * 
 * // Obter processos paginados
 * const processos = await fetchPJEAPI<PagedResponse<Processo>>(
 *   page,
 *   `/pje-comum-api/api/paineladvogado/${idAdvogado}/processos`,
 *   {
 *     idAgrupamentoProcessoTarefa: 1,
 *     pagina: 1,
 *     tamanhoPagina: 100
 *   }
 * );
 * 
 * // Obter audiências
 * const audiencias = await fetchPJEAPI<PagedResponse<Audiencia>>(
 *   page,
 *   '/pje-comum-api/api/pauta-usuarios-externos',
 *   {
 *     dataInicio: '2024-01-01',
 *     dataFim: '2024-12-31',
 *     numeroPagina: 1,
 *     tamanhoPagina: 100
 *   }
 * );
 */
export async function fetchPJEAPI<T>(
  page: Page,
  endpoint: string,
  params?: Record<string, string | number | boolean>
): Promise<T> {
  // Obtém a origem da URL atual do navegador (ex: "https://pje.trt3.jus.br")
  // Isso garante que a URL base seja sempre correta, independente do TRT
  const baseUrl = await page.evaluate(() => window.location.origin);
  let url = `${baseUrl}${endpoint}`;

  // Adiciona parâmetros de query string se fornecidos
  if (params) {
    // Converte todos os valores para string antes de construir a query string
    // Isso é necessário porque URLSearchParams espera strings
    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    url += `?${queryString}`;
  }

  // Executa o fetch dentro do contexto do navegador para ter acesso aos cookies
  const response = await page.evaluate(
    async ({ url, xsrfToken }: { url: string; xsrfToken?: string }) => {
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };

      // Adiciona XSRF token se disponível (atualmente não usado)
      if (xsrfToken) {
        headers['X-XSRF-Token'] = xsrfToken;
      }

      // Faz a requisição GET com credentials: 'include' para enviar cookies automaticamente
      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include', // Envia cookies automaticamente
      });

      // Se a resposta não for ok, lança um erro com o status e texto da resposta
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Retorna o JSON parseado
      return response.json();
    },
    {
      url,
      xsrfToken: undefined, // TODO: Extrair do cookie se necessário
    }
  );

  // Retorna a resposta tipada como T
  return response as T;
}
