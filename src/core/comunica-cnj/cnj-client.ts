/**
 * Cliente HTTP para API do Comunica CNJ
 * API pública para consulta de comunicações processuais
 * https://comunicaapi.pje.jus.br/
 */

import axios, { AxiosError, AxiosInstance, AxiosResponseHeaders, RawAxiosResponseHeaders } from 'axios';
import type {
  CadernoMetadata,
  CadernoMetadataAPI,
  ComunicacaoAPIParams,
  ComunicacaoAPIResponse,
  ComunicacaoAPIResponseRaw,
  ComunicacaoItem,
  ComunicacaoItemRaw,
  ComunicaCNJClientConfig,
  MeioComunicacao,
  RateLimitStatus,
  TribunalInfo,
  TribunalUFResponse,
} from './domain';

// =============================================================================
// RATE LIMIT STATE
// =============================================================================

interface RateLimitState {
  limit: number;
  remaining: number;
  resetAt: Date;
}

const rateLimitState: Map<string, RateLimitState> = new Map();

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Sanitiza erro para logging seguro
 */
function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Erro desconhecido';
}

/**
 * Normaliza item de comunicação raw para formato interno
 */
function normalizeItemComunicacao(raw: ComunicacaoItemRaw): ComunicacaoItem {
  return {
    id: raw.id,
    hash: raw.hash,
    numeroProcesso: raw.numero_processo,
    numeroProcessoComMascara: raw.numeroprocessocommascara || raw.numero_processo,
    siglaTribunal: raw.siglaTribunal,
    nomeClasse: raw.nomeClasse || '',
    codigoClasse: raw.codigoClasse || '',
    tipoComunicacao: raw.tipoComunicacao || '',
    tipoDocumento: raw.tipoDocumento || '',
    numeroComunicacao: raw.numeroComunicacao || 0,
    texto: raw.texto || '',
    link: raw.link || '',
    nomeOrgao: raw.nomeOrgao || '',
    idOrgao: raw.idOrgao || 0,
    dataDisponibilizacao: raw.data_disponibilizacao,
    dataDisponibilizacaoFormatada: raw.datadisponibilizacao || raw.data_disponibilizacao,
    dataCancelamento: raw.data_cancelamento,
    meio: raw.meio,
    meioCompleto: raw.meiocompleto || (raw.meio === 'D' ? 'Diário Eletrônico' : 'Edital'),
    ativo: raw.ativo,
    status: raw.status || 'P',
    motivoCancelamento: raw.motivo_cancelamento,
    destinatarios: raw.destinatarios || [],
    destinatarioAdvogados: raw.destinatarioadvogados || [],
  };
}

/**
 * Normaliza resposta raw da API para formato interno
 */
function normalizeAPIResponse(
  raw: ComunicacaoAPIResponseRaw,
  pagina: number,
  itensPorPagina: number
): ComunicacaoAPIResponse {
  const total = raw.count;
  const totalPaginas = Math.ceil(total / itensPorPagina);

  return {
    comunicacoes: raw.items.map(normalizeItemComunicacao),
    paginacao: {
      pagina,
      itensPorPagina,
      total,
      totalPaginas,
    },
  };
}

/**
 * Flatten tribunais response - API returns nested structure by UF
 */
function flattenTribunais(data: TribunalUFResponse[]): TribunalInfo[] {
  const tribunais: TribunalInfo[] = [];

  for (const uf of data) {
    for (const inst of uf.instituicoes) {
      tribunais.push({
        id: inst.sigla,
        sigla: inst.sigla,
        nome: inst.nome,
        jurisdicao: uf.nomeEstado,
        ultimaAtualizacao: inst.dataUltimoEnvio,
      });
    }
  }

  return tribunais;
}

// =============================================================================
// CLIENT CLASS
// =============================================================================

export class ComunicaCNJClient {
  private client: AxiosInstance;
  private config: Required<ComunicaCNJClientConfig>;
  private defaultRateLimitKey = 'default';

  constructor(config: ComunicaCNJClientConfig) {
    this.config = {
      baseUrl: config.baseUrl || 'https://comunicaapi.pje.jus.br/',
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  // ---------------------------------------------------------------------------
  // CONSULTA DE COMUNICAÇÕES
  // ---------------------------------------------------------------------------

  /**
   * Consulta comunicações na API do CNJ
   * @param params - Parâmetros de busca
   * @returns Dados da API e status de rate limit
   */
  async consultarComunicacoes(params: ComunicacaoAPIParams): Promise<{
    data: ComunicacaoAPIResponse;
    rateLimit: RateLimitStatus;
  }> {
    this.validateConsultaParams(params);

    const rateLimitStatus = this.getRateLimitStatus();
    if (rateLimitStatus.remaining === 0 && rateLimitStatus.resetAt) {
      const waitTime = rateLimitStatus.resetAt.getTime() - Date.now();
      if (waitTime > 0) {
        throw new Error(
          `Rate limit atingido. Retry após ${Math.ceil(waitTime / 1000)} segundos`
        );
      }
    }

    try {
      const sanitizedParams = this.sanitizeParams(params);
      console.log('[ComunicaCNJClient] Consultando comunicações:', {
        params: sanitizedParams,
      });

      // API returns raw format: { status, message, count, items }
      const response = await this.client.get<ComunicacaoAPIResponseRaw>(
        '/api/v1/comunicacao',
        { params: sanitizedParams }
      );

      this.updateRateLimitState(response.headers);

      // Normalize to internal format
      const pagina = params.pagina || 1;
      const itensPorPagina = params.itensPorPagina || 100;
      const normalized = normalizeAPIResponse(response.data, pagina, itensPorPagina);

      console.log('[ComunicaCNJClient] Resposta recebida:', {
        total: normalized.paginacao.total,
        pagina: normalized.paginacao.pagina,
        comunicacoes: normalized.comunicacoes.length,
      });

      return {
        data: normalized,
        rateLimit: this.extractRateLimitFromHeaders(response.headers),
      };
    } catch (error) {
      return this.handleConsultaError(error, params);
    }
  }

  // ---------------------------------------------------------------------------
  // CERTIDÃO (PDF)
  // ---------------------------------------------------------------------------

  /**
   * Obtém a certidão (PDF) de uma comunicação
   * @param hash - Hash único da comunicação
   * @returns Buffer com o PDF
   */
  async obterCertidao(hash: string): Promise<Buffer> {
    if (!hash || typeof hash !== 'string' || hash.trim().length === 0) {
      throw new Error('Hash inválido');
    }

    try {
      console.log('[ComunicaCNJClient] Obtendo certidão para hash:', hash);

      const response = await this.client.get(
        `/api/v1/comunicacao/${hash}/certidao`,
        { responseType: 'arraybuffer' }
      );

      console.log('[ComunicaCNJClient] Resposta recebida:', {
        status: response.status,
        contentType: response.headers['content-type'],
        dataLength: response.data?.byteLength || response.data?.length || 0,
      });

      let pdfBuffer: Buffer;
      if (Buffer.isBuffer(response.data)) {
        pdfBuffer = response.data;
      } else if (response.data instanceof ArrayBuffer) {
        pdfBuffer = Buffer.from(response.data);
      } else if (typeof response.data === 'string') {
        pdfBuffer = Buffer.from(response.data, 'binary');
      } else {
        pdfBuffer = Buffer.from(response.data as Uint8Array);
      }

      if (!pdfBuffer || pdfBuffer.length === 0) {
        console.error(
          '[ComunicaCNJClient] Certidão vazia - buffer length:',
          pdfBuffer?.length
        );
        throw new Error('Certidão vazia retornada pela API');
      }

      console.log(
        '[ComunicaCNJClient] Certidão obtida com sucesso, tamanho:',
        pdfBuffer.length,
        'bytes'
      );
      return pdfBuffer;
    } catch (error) {
      console.error('[ComunicaCNJClient] Erro ao obter certidão:', error);

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 404) {
          throw new Error('Certidão não encontrada');
        }
        throw new Error(`Erro ao obter certidão: ${sanitizeError(error)}`);
      }
      throw new Error(`Erro ao obter certidão: ${sanitizeError(error)}`);
    }
  }

  // ---------------------------------------------------------------------------
  // TRIBUNAIS
  // ---------------------------------------------------------------------------

  /**
   * Lista todos os tribunais disponíveis na API do CNJ
   * @returns Lista de tribunais
   */
  async listarTribunais(): Promise<TribunalInfo[]> {
    try {
      console.log('[ComunicaCNJClient] Listando tribunais...');

      // API returns nested structure: [{ uf, nomeEstado, instituicoes: [...] }, ...]
      const response = await this.client.get<TribunalUFResponse[]>(
        '/api/v1/comunicacao/tribunal'
      );

      // Flatten the nested structure
      const tribunais = flattenTribunais(response.data);

      console.log(
        '[ComunicaCNJClient] Tribunais obtidos:',
        tribunais.length
      );

      return tribunais;
    } catch (error) {
      throw new Error(`Erro ao listar tribunais: ${sanitizeError(error)}`);
    }
  }

  // ---------------------------------------------------------------------------
  // CADERNO
  // ---------------------------------------------------------------------------

  /**
   * Obtém metadados do caderno (compilado de comunicações)
   * @param siglaTribunal - Sigla do tribunal (ex: TRT1)
   * @param data - Data no formato yyyy-mm-dd
   * @param meio - Meio de comunicação ('E' ou 'D')
   * @returns Metadados do caderno
   */
  async obterCaderno(
    siglaTribunal: string,
    data: string,
    meio: MeioComunicacao
  ): Promise<CadernoMetadata> {
    if (!siglaTribunal || typeof siglaTribunal !== 'string') {
      throw new Error('Sigla do tribunal inválida');
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      throw new Error('Data inválida. Use o formato yyyy-mm-dd');
    }

    try {
      console.log('[ComunicaCNJClient] Obtendo caderno:', {
        siglaTribunal,
        data,
        meio,
      });

      const response = await this.client.get<CadernoMetadataAPI>(
        `/api/v1/caderno/${siglaTribunal}/${data}/${meio}`
      );

      const apiData = response.data;
      const now = new Date();
      const expiresAt =
        apiData.expires_at || apiData.expiresAt
          ? new Date(apiData.expires_at || apiData.expiresAt!)
          : new Date(now.getTime() + 5 * 60 * 1000);

      const normalized: CadernoMetadata = {
        tribunal:
          apiData.tribunal || apiData.sigla_tribunal || siglaTribunal,
        sigla: apiData.sigla || apiData.sigla_tribunal || siglaTribunal,
        meio: apiData.meio,
        data: apiData.data,
        totalComunicacoes:
          apiData.total_comunicacoes || apiData.totalComunicacoes || 0,
        url: apiData.url,
        expiresAt: expiresAt.toISOString(),
      };

      console.log('[ComunicaCNJClient] Caderno obtido:', normalized);

      return normalized;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 404) {
          throw new Error(
            'Caderno não encontrado para a data/tribunal especificados'
          );
        }
        if (axiosError.response?.status === 422) {
          throw new Error('Parâmetros inválidos');
        }
        throw new Error(`Erro ao obter caderno: ${sanitizeError(error)}`);
      }
      throw new Error(`Erro ao obter caderno: ${sanitizeError(error)}`);
    }
  }

  // ---------------------------------------------------------------------------
  // RATE LIMIT
  // ---------------------------------------------------------------------------

  /**
   * Obtém status atual do rate limit
   */
  getRateLimitStatus(): RateLimitStatus {
    const state = rateLimitState.get(this.defaultRateLimitKey);
    if (!state) {
      return { limit: 0, remaining: 0 };
    }
    if (state.resetAt && state.resetAt.getTime() <= Date.now()) {
      rateLimitState.delete(this.defaultRateLimitKey);
      return { limit: 0, remaining: 0 };
    }
    return {
      limit: state.limit,
      remaining: state.remaining,
      resetAt: state.resetAt,
    };
  }

  // ---------------------------------------------------------------------------
  // PRIVATE METHODS
  // ---------------------------------------------------------------------------

  private validateConsultaParams(params: ComunicacaoAPIParams): void {
    const hasFilter =
      params.siglaTribunal ||
      params.texto ||
      params.nomeParte ||
      params.nomeAdvogado ||
      params.numeroOab ||
      params.numeroProcesso ||
      params.numeroComunicacao ||
      params.orgaoId ||
      params.dataInicio ||
      params.dataFim ||
      params.meio;

    if (
      !hasFilter &&
      (params.itensPorPagina === undefined || params.itensPorPagina > 5)
    ) {
      throw new Error(
        'Pelo menos um filtro deve ser preenchido ou itensPorPagina deve ser <= 5 para busca sem filtros'
      );
    }

    if (params.itensPorPagina !== undefined) {
      if (params.itensPorPagina !== 5 && params.itensPorPagina !== 100) {
        throw new Error('itensPorPagina deve ser 5 ou 100');
      }
    }

    if (params.dataInicio && params.dataFim) {
      const inicio = new Date(params.dataInicio);
      const fim = new Date(params.dataFim);
      if (inicio > fim) {
        throw new Error('dataInicio deve ser anterior a dataFim');
      }
    }
  }

  private sanitizeParams(
    params: ComunicacaoAPIParams
  ): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private updateRateLimitState(headers: AxiosResponseHeaders | Partial<RawAxiosResponseHeaders>): void {
    const limitHeader = headers['x-ratelimit-limit'];
    const remainingHeader = headers['x-ratelimit-remaining'];
    const resetHeader = headers['x-ratelimit-reset'];

    const limit = limitHeader ? parseInt(String(limitHeader), 10) : 0;
    const remaining = remainingHeader ? parseInt(String(remainingHeader), 10) : 0;
    const resetAt = resetHeader
      ? new Date(parseInt(String(resetHeader), 10) * 1000)
      : new Date(Date.now() + 60000);

    rateLimitState.set(this.defaultRateLimitKey, { limit, remaining, resetAt });
  }

  private extractRateLimitFromHeaders(
    headers: AxiosResponseHeaders | Partial<RawAxiosResponseHeaders>
  ): RateLimitStatus {
    const limitHeader = headers['x-ratelimit-limit'];
    const remainingHeader = headers['x-ratelimit-remaining'];
    const resetHeader = headers['x-ratelimit-reset'];

    const limit = limitHeader ? parseInt(String(limitHeader), 10) : 0;
    const remaining = remainingHeader ? parseInt(String(remainingHeader), 10) : 0;
    const resetAt = resetHeader
      ? new Date(parseInt(String(resetHeader), 10) * 1000)
      : undefined;
    return { limit, remaining, resetAt };
  }

  private async waitForRateLimit(): Promise<void> {
    console.log('[ComunicaCNJClient] Aguardando rate limit (60s)...');
    return new Promise((resolve) => {
      setTimeout(resolve, 60000);
    });
  }

  private async handleConsultaError(
    error: unknown,
    params: ComunicacaoAPIParams
  ): Promise<{
    data: ComunicacaoAPIResponse;
    rateLimit: RateLimitStatus;
  }> {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{
        message?: string;
        error?: string;
      }>;

      // Rate limit - aguarda e tenta novamente
      if (axiosError.response?.status === 429) {
        await this.waitForRateLimit();
        return this.consultarComunicacoes(params);
      }

      // Validação
      if (axiosError.response?.status === 422) {
        const message =
          axiosError.response.data?.message ||
          axiosError.response.data?.error ||
          'Parâmetros inválidos';
        throw new Error(`Validação falhou: ${message}`);
      }

      // Outros erros
      const message =
        axiosError.response?.data?.message ||
        axiosError.message ||
        'Erro desconhecido';
      throw new Error(`Erro ao consultar comunicações: ${message}`);
    }

    throw new Error(
      `Erro ao consultar comunicações: ${sanitizeError(error)}`
    );
  }
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Cria cliente a partir de variáveis de ambiente
 */
export function createComunicaCNJClientFromEnv(): ComunicaCNJClient {
  const config: ComunicaCNJClientConfig = {
    baseUrl:
      process.env.COMUNICA_CNJ_API_URL || 'https://comunicaapi.pje.jus.br/',
    timeout: process.env.COMUNICA_CNJ_REQUEST_TIMEOUT
      ? parseInt(process.env.COMUNICA_CNJ_REQUEST_TIMEOUT, 10)
      : 30000,
    maxRetries: process.env.COMUNICA_CNJ_MAX_RETRIES
      ? parseInt(process.env.COMUNICA_CNJ_MAX_RETRIES, 10)
      : 3,
  };
  return new ComunicaCNJClient(config);
}

/**
 * Singleton instance do cliente
 */
let clientInstance: ComunicaCNJClient | null = null;

/**
 * Obtém instância singleton do cliente
 */
export function getComunicaCNJClient(): ComunicaCNJClient {
  if (!clientInstance) {
    clientInstance = createComunicaCNJClientFromEnv();
  }
  return clientInstance;
}
