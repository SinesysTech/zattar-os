/**
 * Arquivo: audiencias.ts
 * 
 * PROPÓSITO:
 * Este arquivo contém funções específicas para obter audiências do PJE TRT.
 * As audiências usam um endpoint diferente dos processos e têm parâmetros específicos
 * relacionados a datas e status.
 * 
 * DEPENDÊNCIAS:
 * - types.ts: Importa PagedResponse e Audiencia
 * - fetch.ts: Importa fetchPJEAPI para fazer requisições HTTP
 * - playwright: Importa o tipo Page para interagir com o navegador
 * 
 * EXPORTAÇÕES:
 * - obterPautaAudiencias(): Retorna uma página específica de audiências
 * - obterTodasAudiencias(): Retorna todas as páginas de audiências automaticamente
 * 
 * QUEM USA ESTE ARQUIVO:
 * - audiencias.service.ts: Importa obterTodasAudiencias e Audiencia
 */

import type { Page } from 'playwright';
import { fetchPJEAPI } from './fetch';
import type { PagedResponse, Audiencia } from '@/backend/types/pje-trt/types';

/**
 * Função: obterPautaAudiencias
 * 
 * PROPÓSITO:
 * Obtém uma página específica da pauta de audiências do PJE.
 * Esta função retorna apenas uma página por vez. Para obter todas as páginas, use obterTodasAudiencias().
 * 
 * PARÂMETROS:
 * - page: Page (obrigatório)
 *   Tipo: Page do Playwright
 *   Significado: Instância da página do navegador autenticada no PJE
 *   Por que é necessário: Precisa do contexto do navegador para fazer requisições autenticadas
 * 
 * - dataInicio: string (obrigatório)
 *   Tipo: string
 *   Significado: Data inicial do período de busca de audiências
 *   Formato: YYYY-MM-DD (ex: "2024-01-01")
 *   Exemplo: "2024-01-01"
 *   Validação: Deve ser uma data válida no formato ISO
 * 
 * - dataFim: string (obrigatório)
 *   Tipo: string
 *   Significado: Data final do período de busca de audiências
 *   Formato: YYYY-MM-DD (ex: "2024-12-31")
 *   Exemplo: "2024-12-31"
 *   Validação: Deve ser uma data válida no formato ISO e ser posterior ou igual a dataInicio
 * 
 * - numeroPagina: number (opcional, padrão: 1)
 *   Tipo: number
 *   Significado: Número da página a ser retornada (começa em 1)
 *   Valores possíveis: Qualquer número inteiro >= 1
 *   Padrão: 1 (primeira página)
 *   Exemplo: 2 (segunda página)
 * 
 * - tamanhoPagina: number (opcional, padrão: 100)
 *   Tipo: number
 *   Significado: Quantidade de registros por página
 *   Valores possíveis: Geralmente entre 1 e 100 (máximo recomendado)
 *   Padrão: 100
 *   Exemplo: 50 (retorna 50 audiências por página)
 * 
 * - codigoSituacao: string (opcional, padrão: 'M')
 *   Tipo: string
 *   Significado: Código da situação das audiências a serem retornadas
 *   Valores possíveis:
 *   - 'M': Marcadas/Designadas (audiências agendadas, ainda não realizadas)
 *   - 'R': Realizadas (audiências que já foram realizadas)
 *   - 'C': Canceladas (audiências que foram canceladas)
 *   Padrão: 'M' (audiências marcadas/designadas)
 *   Exemplo: 'R' (apenas audiências realizadas)
 * 
 * - ordenacao: 'asc' | 'desc' (opcional, padrão: 'asc')
 *   Tipo: Literal 'asc' ou 'desc'
 *   Significado: Ordenação dos resultados por data
 *   Valores possíveis:
 *   - 'asc': Ordenação crescente (mais antigas primeiro)
 *   - 'desc': Ordenação decrescente (mais recentes primeiro)
 *   Padrão: 'asc'
 *   Exemplo: 'desc' (mais recentes primeiro)
 * 
 * RETORNO:
 * Tipo: Promise<PagedResponse<Audiencia>>
 * Significado: Objeto com informações de paginação e array de audiências da página solicitada
 * Formato:
 * {
 *   pagina: 1,
 *   tamanhoPagina: 100,
 *   qtdPaginas: 3,
 *   totalRegistros: 250,
 *   resultado: [Audiencia, Audiencia, ...] // Array com até 100 audiências
 * }
 * 
 * CHAMADAS INTERNAS:
 * - fetchPJEAPI<PagedResponse<Audiencia>>(): Faz a requisição HTTP GET para o endpoint de audiências
 * - console.log(): Registra informações de debug sobre a chamada e resposta
 * - console.error(): Registra erros caso ocorram
 * 
 * CHAMADAS EXTERNAS:
 * Esta função é chamada por:
 * - obterTodasAudiencias(): Usa obterPautaAudiencias() internamente para buscar todas as páginas
 * - audiencias.service.ts: Usa obterTodasAudiencias() que chama obterPautaAudiencias()
 * 
 * ENDPOINT HTTP:
 * GET /pje-comum-api/api/pauta-usuarios-externos?dataInicio={dataInicio}&dataFim={dataFim}&numeroPagina={numeroPagina}&tamanhoPagina={tamanhoPagina}&codigoSituacao={codigoSituacao}&ordenacao={ordenacao}
 * 
 * Exemplo completo:
 * GET https://pje.trt3.jus.br/pje-comum-api/api/pauta-usuarios-externos?dataInicio=2024-01-01&dataFim=2024-12-31&numeroPagina=1&tamanhoPagina=100&codigoSituacao=M&ordenacao=asc
 * 
 * COMPORTAMENTO ESPECIAL:
 * 
 * 1. Logging:
 *    - Registra informações sobre a chamada antes de fazer a requisição
 *    - Registra informações sobre a resposta após receber os dados
 *    - Registra erros caso ocorram durante a requisição
 *    - Logs incluem emojis para facilitar identificação visual
 * 
 * 2. Tratamento de Erros:
 *    - Se a requisição falhar, o erro é logado e depois relançado
 *    - O erro original é preservado para permitir tratamento adequado pelo chamador
 * 
 * 3. Validação de Parâmetros:
 *    - Não valida formato de data nesta função (validação deve ser feita pelo chamador)
 *    - Não valida se dataInicio <= dataFim (validação deve ser feita pelo chamador)
 * 
 * EXEMPLO DE USO:
 * 
 * // Obter primeira página de audiências marcadas para janeiro de 2024
 * const primeiraPagina = await obterPautaAudiencias(
 *   page,
 *   '2024-01-01',
 *   '2024-01-31',
 *   1,
 *   100,
 *   'M',
 *   'asc'
 * );
 * 
 * // Obter segunda página de audiências realizadas
 * const segundaPagina = await obterPautaAudiencias(
 *   page,
 *   '2024-01-01',
 *   '2024-12-31',
 *   2,
 *   100,
 *   'R',
 *   'desc'
 * );
 */
export async function obterPautaAudiencias(
  page: Page,
  dataInicio: string, // YYYY-MM-DD
  dataFim: string, // YYYY-MM-DD
  numeroPagina: number = 1,
  tamanhoPagina: number = 100,
  codigoSituacao: string = 'M', // M=Designada/Marcada, R=Realizada, C=Cancelada
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

/**
 * Função: obterTodasAudiencias
 * 
 * PROPÓSITO:
 * Obtém TODAS as páginas de audiências de um período automaticamente.
 * Esta função faz paginação automática internamente, chamando obterPautaAudiencias() várias vezes
 * até obter todas as audiências disponíveis no período especificado.
 * 
 * IMPORTANTE:
 * Esta função é mais conveniente que obterPautaAudiencias() quando você precisa de todas as audiências,
 * mas pode ser mais lenta devido ao delay entre páginas e múltiplas requisições HTTP.
 * 
 * PARÂMETROS:
 * - page: Page (obrigatório)
 *   Tipo: Page do Playwright
 *   Significado: Instância da página do navegador autenticada no PJE
 *   Por que é necessário: Precisa do contexto do navegador para fazer requisições autenticadas
 * 
 * - dataInicio: string (obrigatório)
 *   Tipo: string
 *   Significado: Data inicial do período de busca de audiências
 *   Formato: YYYY-MM-DD (ex: "2024-01-01")
 *   Exemplo: "2024-01-01"
 *   Validação: Deve ser uma data válida no formato ISO
 * 
 * - dataFim: string (obrigatório)
 *   Tipo: string
 *   Significado: Data final do período de busca de audiências
 *   Formato: YYYY-MM-DD (ex: "2024-12-31")
 *   Exemplo: "2024-12-31"
 *   Validação: Deve ser uma data válida no formato ISO e ser posterior ou igual a dataInicio
 * 
 * - codigoSituacao: string (opcional, padrão: 'M')
 *   Tipo: string
 *   Significado: Código da situação das audiências a serem retornadas
 *   Valores possíveis:
 *   - 'M': Marcadas/Designadas (audiências agendadas, ainda não realizadas)
 *   - 'R': Realizadas (audiências que já foram realizadas)
 *   - 'C': Canceladas (audiências que foram canceladas)
 *   Padrão: 'M' (audiências marcadas/designadas)
 *   Exemplo: 'R' (apenas audiências realizadas)
 * 
 * - delayEntrePaginas: number (opcional, padrão: 500)
 *   Tipo: number
 *   Significado: Delay em milissegundos entre requisições de páginas diferentes
 *   Unidade: Milissegundos (ms)
 *   Padrão: 500ms (meio segundo)
 *   Por que existe: Evita sobrecarregar o servidor com muitas requisições simultâneas (rate limiting)
 *   Exemplo: 1000 (1 segundo entre cada página)
 * 
 * RETORNO:
 * Tipo: Promise<Audiencia[]>
 * Significado: Array com TODAS as audiências de todas as páginas no período especificado
 * Formato: Array simples de Audiencia (não é paginado)
 * Exemplo: [Audiencia, Audiencia, Audiencia, ...] // Pode ter centenas de audiências
 * 
 * CHAMADAS INTERNAS:
 * - obterPautaAudiencias(): Chamada múltiplas vezes (uma vez por página) para obter todas as páginas
 * - setTimeout(): Usado para criar delay entre requisições (rate limiting)
 * - console.log(): Registra informações de progresso durante a busca
 * - console.error(): Registra erros caso ocorram
 * 
 * CHAMADAS EXTERNAS:
 * Esta função é chamada por:
 * - audiencias.service.ts: Para obter todas as audiências de um período
 * 
 * ENDPOINT HTTP:
 * Mesmo endpoint de obterPautaAudiencias(), mas chamado múltiplas vezes:
 * GET /pje-comum-api/api/pauta-usuarios-externos?dataInicio={dataInicio}&dataFim={dataFim}&numeroPagina={pagina}&tamanhoPagina=100&codigoSituacao={codigoSituacao}&ordenacao=asc
 * 
 * COMPORTAMENTO ESPECIAL:
 * 
 * 1. Paginação Automática:
 *    - Primeiro chama obterPautaAudiencias() com numeroPagina=1 para obter a primeira página
 *    - Lê o campo qtdPaginas da resposta para saber quantas páginas existem
 *    - Faz um loop de numeroPagina=2 até qtdPaginas, chamando obterPautaAudiencias() para cada página
 *    - Concatena todos os resultados em um único array
 * 
 * 2. Validações:
 *    - Valida se a resposta é um objeto válido
 *    - Valida se o campo resultado é um array
 *    - Se resultado.length=0 ou totalRegistros=0, retorna array vazio imediatamente
 *    - Se alguma página retornar resposta inválida, lança um erro
 * 
 * 3. Rate Limiting:
 *    - Adiciona um delay entre cada requisição de página
 *    - Delay padrão: 500ms (meio segundo)
 *    - Pode ser configurado através do parâmetro delayEntrePaginas
 *    - Ajuda a evitar sobrecarregar o servidor
 * 
 * 4. Logging Detalhado:
 *    - Registra início da busca com parâmetros
 *    - Registra progresso de cada página
 *    - Registra total de audiências obtidas
 *    - Registra erros caso ocorram
 *    - Logs incluem emojis para facilitar identificação visual
 * 
 * 5. Tratamento de Erros:
 *    - Se a primeira página retornar resposta inválida, lança erro imediatamente
 *    - Se alguma página subsequente retornar resposta inválida, lança erro com número da página
 *    - Erros incluem a estrutura completa da resposta inválida para debug
 * 
 * 6. Otimização:
 *    - Sempre usa tamanhoPagina=100 (máximo) para minimizar número de requisições
 *    - Sempre usa ordenacao='asc' (padrão)
 *    - Se houver apenas 1 página, retorna imediatamente sem fazer loop
 * 
 * 7. Casos Especiais:
 *    - A API pode retornar qtdPaginas=0 mesmo com resultados quando tamanhoPagina >= totalRegistros
 *    - Neste caso, verifica se resultado.length > 0 antes de retornar array vazio
 * 
 * EXEMPLO DE USO:
 * 
 * // Obter todas as audiências marcadas para 2024
 * const todasAudiencias = await obterTodasAudiencias(
 *   page,
 *   '2024-01-01',
 *   '2024-12-31',
 *   'M'
 * );
 * console.log(`Total de audiências: ${todasAudiencias.length}`);
 * 
 * // Obter todas as audiências realizadas com delay customizado
 * const audienciasRealizadas = await obterTodasAudiencias(
 *   page,
 *   '2024-01-01',
 *   '2024-12-31',
 *   'R',
 *   1000 // 1 segundo entre páginas
 * );
 */
export async function obterTodasAudiencias(
  page: Page,
  dataInicio: string,
  dataFim: string,
  codigoSituacao: string = 'M',
  delayEntrePaginas: number = 500
): Promise<Audiencia[]> {
  const todasAudiencias: Audiencia[] = [];

  console.log('🔍 [obterTodasAudiencias] Iniciando busca de audiências...', {
    dataInicio,
    dataFim,
    codigoSituacao,
  });

  // Primeira página para obter total de páginas
  console.log('📄 [obterTodasAudiencias] Buscando primeira página...');
  const primeiraPagina = await obterPautaAudiencias(
    page,
    dataInicio,
    dataFim,
    1, // numeroPagina
    100, // tamanhoPagina (sempre usa máximo para minimizar requisições)
    codigoSituacao,
    'asc' // ordenacao (sempre usa 'asc' como padrão)
  );

  console.log('📊 [obterTodasAudiencias] Primeira página recebida:', {
    totalRegistros: primeiraPagina.totalRegistros,
    qtdPaginas: primeiraPagina.qtdPaginas,
    resultadoLength: primeiraPagina.resultado?.length || 0,
  });

  // Validar estrutura da resposta
  if (!primeiraPagina || typeof primeiraPagina !== 'object') {
    console.error('❌ [obterTodasAudiencias] Resposta inválida:', primeiraPagina);
    throw new Error(`Resposta inválida da API: ${JSON.stringify(primeiraPagina)}`);
  }

  // Validar que resultado é um array
  if (!Array.isArray(primeiraPagina.resultado)) {
    console.error('❌ [obterTodasAudiencias] Campo resultado não é array:', primeiraPagina);
    throw new Error(
      `Campo 'resultado' não é um array na resposta da API. Estrutura recebida: ${JSON.stringify(primeiraPagina, null, 2)}`
    );
  }

  // Se não há resultados no array, retornar array vazio
  // Nota: A API pode retornar qtdPaginas=0 mesmo com resultados quando tamanhoPagina >= totalRegistros
  if (primeiraPagina.resultado.length === 0 || primeiraPagina.totalRegistros === 0) {
    console.log('ℹ️ [obterTodasAudiencias] Nenhum resultado encontrado (array vazio ou totalRegistros=0)');
    return [];
  }

  console.log(`✅ [obterTodasAudiencias] Adicionando ${primeiraPagina.resultado.length} audiências da primeira página`);
  todasAudiencias.push(...primeiraPagina.resultado);

  // Buscar páginas restantes
  const qtdPaginas = primeiraPagina.qtdPaginas || 1;
  console.log(`📄 [obterTodasAudiencias] Total de páginas: ${qtdPaginas}`);

  if (qtdPaginas > 1) {
    for (let p = 2; p <= qtdPaginas; p++) {
      // Delay para rate limiting (evita sobrecarregar o servidor)
      await new Promise((resolve) => setTimeout(resolve, delayEntrePaginas));

      console.log(`📄 [obterTodasAudiencias] Buscando página ${p}/${qtdPaginas}...`);
      const pagina = await obterPautaAudiencias(
        page,
        dataInicio,
        dataFim,
        p, // numeroPagina
        100, // tamanhoPagina (sempre usa máximo)
        codigoSituacao,
        'asc' // ordenacao (sempre usa 'asc')
      );

      if (!pagina || !Array.isArray(pagina.resultado)) {
        console.error(`❌ [obterTodasAudiencias] Resposta inválida na página ${p}:`, pagina);
        throw new Error(
          `Resposta inválida na página ${p}: ${JSON.stringify(pagina)}`
        );
      }

      console.log(`✅ [obterTodasAudiencias] Adicionando ${pagina.resultado.length} audiências da página ${p}`);
      todasAudiencias.push(...pagina.resultado);
    }
  }

  console.log(`✅ [obterTodasAudiencias] Total de audiências obtidas: ${todasAudiencias.length}`);
  return todasAudiencias;
}

