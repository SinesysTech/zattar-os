// Serviço comum para chamadas de API do PJE
// Usa cookies de sessão para autenticação (não usa Authorization header)
// Documentação: dev_data/APIs-PJE.md

import type { Page } from 'playwright';

/**
 * Resposta paginada padrão das APIs do PJE
 */
export interface PagedResponse<T> {
  pagina: number;
  tamanhoPagina: number;
  qtdPaginas: number;
  totalRegistros: number;
  resultado: T[];
}

/**
 * Totalizadores do painel do advogado
 */
export interface Totalizador {
  quantidadeProcessos: number;
  idAgrupamentoProcessoTarefa: number;
  nomeAgrupamentoTarefa: string;
  ordem: number;
  destaque: boolean;
}

/**
 * Processo retornado pela API
 */
export interface Processo {
  id: number;
  descricaoOrgaoJulgador: string;
  classeJudicial: string;
  numero: number;
  numeroProcesso: string;
  segredoDeJustica: boolean;
  codigoStatusProcesso: string;
  prioridadeProcessual: number;
  nomeParteAutora: string;
  qtdeParteAutora: number;
  nomeParteRe: string;
  qtdeParteRe: number;
  dataAutuacao: string;
  juizoDigital: boolean;
  dataArquivamento?: string;
  dataProximaAudiencia?: string | null;
  temAssociacao: boolean;
}

/**
 * Audiência retornada pela API
 */
export interface Audiencia {
  id: number;
  dataInicio: string;
  dataFim: string;
  salaAudiencia: {
    nome: string;
    id: number;
  };
  status: string;
  processo: {
    id: number;
    numero: string;
    classeJudicial: {
      id: number;
      descricao: string;
    };
    orgaoJulgador: {
      id: number;
      nome?: string;
      descricao?: string;
      cejusc?: boolean;
      ativo?: boolean;
      postoAvancado?: boolean;
      novoOrgaoJulgador?: boolean;
      codigoServentiaCnj?: number;
    };
  };
  tipo: {
    id: number;
    descricao: string;
  };
  poloAtivo: {
    nome: string;
    cpf: string;
  };
  poloPassivo: {
    nome: string;
    cnpj: string;
  };
  urlAudienciaVirtual?: string;
  pautaAudienciaHorario: {
    horaInicial: string;
    horaFinal: string;
  };
}

/**
 * Agrupamentos de processos
 */
export enum AgrupamentoProcessoTarefa {
  ACERVO_GERAL = 1,
  PENDENTES_MANIFESTACAO = 2,
  ARQUIVADOS = 5,
}

/**
 * Faz uma requisição GET para a API do PJE usando cookies de sessão
 * 
 * IMPORTANTE: Usa cookies automaticamente (credentials: 'include')
 * NÃO usa Authorization header - causa erro 401
 */
async function fetchPJEAPI<T>(
  page: Page,
  endpoint: string,
  params?: Record<string, string | number | boolean>
): Promise<T> {
  const baseUrl = await page.evaluate(() => window.location.origin);
  let url = `${baseUrl}${endpoint}`;

  // Adicionar parâmetros de query
  if (params) {
    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    url += `?${queryString}`;
  }

  const response = await page.evaluate(
    async ({ url, xsrfToken }: { url: string; xsrfToken?: string }) => {
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };

      // Adicionar XSRF token se disponível
      if (xsrfToken) {
        headers['X-XSRF-Token'] = xsrfToken;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include', // Envia cookies automaticamente
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return response.json();
    },
    {
      url,
      xsrfToken: undefined, // TODO: Extrair do cookie se necessário
    }
  );

  return response as T;
}

/**
 * Obtém totalizadores do painel do advogado
 * Endpoint: GET /pje-comum-api/api/paineladvogado/{idAdvogado}/totalizadores
 */
export async function obterTotalizadores(
  page: Page,
  idAdvogado: number
): Promise<Totalizador[]> {
  return fetchPJEAPI<Totalizador[]>(
    page,
    `/pje-comum-api/api/paineladvogado/${idAdvogado}/totalizadores`,
    { tipoPainelAdvogado: 0 }
  );
}

/**
 * Obtém lista paginada de processos de um agrupamento
 * Endpoint: GET /pje-comum-api/api/paineladvogado/{idAdvogado}/processos
 */
export async function obterProcessos(
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
 * Obtém todos os processos de um agrupamento (com paginação automática)
 */
export async function obterTodosProcessos(
  page: Page,
  idAdvogado: number,
  idAgrupamento: AgrupamentoProcessoTarefa,
  delayEntrePaginas: number = 500,
  paramsAdicionais?: Record<string, string | number | boolean>
): Promise<Processo[]> {
  const todosProcessos: Processo[] = [];

  // Primeira página para obter total de páginas
  const primeiraPagina = await obterProcessos(
    page,
    idAdvogado,
    idAgrupamento,
    1,
    100,
    paramsAdicionais
  );

  // Validar estrutura da resposta
  if (!primeiraPagina || typeof primeiraPagina !== 'object') {
    throw new Error(`Resposta inválida da API: ${JSON.stringify(primeiraPagina)}`);
  }

  // Se não há resultados, retornar array vazio
  if (primeiraPagina.totalRegistros === 0 || primeiraPagina.qtdPaginas === 0) {
    return [];
  }

  // Validar que resultado é um array
  if (!Array.isArray(primeiraPagina.resultado)) {
    throw new Error(
      `Campo 'resultado' não é um array na resposta da API. Estrutura recebida: ${JSON.stringify(primeiraPagina, null, 2)}`
    );
  }

  todosProcessos.push(...primeiraPagina.resultado);

  // Buscar páginas restantes
  const qtdPaginas = primeiraPagina.qtdPaginas || 1;
  for (let p = 2; p <= qtdPaginas; p++) {
    // Delay para rate limiting
    await new Promise((resolve) => setTimeout(resolve, delayEntrePaginas));

    const pagina = await obterProcessos(
      page,
      idAdvogado,
      idAgrupamento,
      p,
      100,
      paramsAdicionais
    );

    if (!pagina || !Array.isArray(pagina.resultado)) {
      throw new Error(
        `Resposta inválida na página ${p}: ${JSON.stringify(pagina)}`
      );
    }

    todosProcessos.push(...pagina.resultado);
  }

  return todosProcessos;
}

/**
 * Obtém pauta de audiências
 * Endpoint: GET /pje-comum-api/api/pauta-usuarios-externos
 * 
 * Parâmetros obrigatórios:
 * - dataInicio: Data inicial (YYYY-MM-DD)
 * - dataFim: Data final (YYYY-MM-DD)
 * - numeroPagina: Número da página (inicia em 1)
 * - tamanhoPagina: Quantidade de registros por página (máx: 100)
 * 
 * Parâmetros opcionais:
 * - codigoSituacao: Código da situação (M=Marcada/Designada, R=Realizada, C=Cancelada)
 * - ordenacao: Ordenação (asc ou desc)
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
 * Obtém todas as audiências de um período (com paginação automática)
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
    100, // tamanhoPagina
    codigoSituacao,
    'asc' // ordenacao
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
      // Delay para rate limiting
      await new Promise((resolve) => setTimeout(resolve, delayEntrePaginas));

      console.log(`📄 [obterTodasAudiencias] Buscando página ${p}/${qtdPaginas}...`);
      const pagina = await obterPautaAudiencias(
        page,
        dataInicio,
        dataFim,
        p, // numeroPagina
        100, // tamanhoPagina
        codigoSituacao,
        'asc' // ordenacao
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

