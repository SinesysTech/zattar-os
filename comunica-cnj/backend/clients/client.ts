/**
 * Cliente HTTP para API do Comunica CNJ
 * API pública para consulta de comunicações processuais
 */

import axios, { AxiosError, AxiosInstance } from 'axios';
import type {
  CadernoMetadata,
  CadernoMetadataAPI,
  ComunicacaoAPIParams,
  ComunicacaoAPIResponse,
  ComunicacaoItem,
  MeioComunicacao,
  RateLimitStatus,
  TribunalCNJInfo,
} from '@/lib/types/comunica-cnj';
import { sanitizeError } from '@/lib/utils/sanitization';

export interface ComunicaCNJConfig {
  baseUrl: string;
  timeout?: number;
  maxRetries?: number;
}

interface RateLimitState {
  limit: number;
  remaining: number;
  resetAt: Date;
}

const rateLimitState: Map<string, RateLimitState> = new Map();

export class ComunicaCNJClient {
  private client: AxiosInstance;
  private config: Required<ComunicaCNJConfig>;
  private defaultRateLimitKey = 'default';

  constructor(config: ComunicaCNJConfig) {
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
        'Accept': 'application/json',
      },
    });
  }

  async consultarComunicacoes(params: ComunicacaoAPIParams): Promise<{
    data: ComunicacaoAPIResponse;
    rateLimit: RateLimitStatus;
  }> {
    this.validateConsultaParams(params);
    const rateLimitStatus = this.getRateLimitStatus();
    if (rateLimitStatus.remaining === 0 && rateLimitStatus.resetAt) {
      const waitTime = rateLimitStatus.resetAt.getTime() - Date.now();
      if (waitTime > 0) {
        throw new Error(`Rate limit atingido. Retry após ${Math.ceil(waitTime / 1000)} segundos`);
      }
    }

    try {
      const sanitizedParams = this.sanitizeParams(params);
      console.log('[ComunicaCNJClient] Parâmetros sanitizados enviados para API:', sanitizedParams);
      const response = await this.client.get<ComunicacaoAPIResponse>('/api/v1/comunicacao', {
        params: sanitizedParams,
      });

      this.updateRateLimitState(response.headers);

      return {
        data: response.data,
        rateLimit: this.extractRateLimitFromHeaders(response.headers),
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string; error?: string }>;

        if (axiosError.response?.status === 429) {
          await this.waitForRateLimit();
          return this.consultarComunicacoes(params);
        }

        if (axiosError.response?.status === 422) {
          const message =
            axiosError.response.data?.message || axiosError.response.data?.error || 'Parâmetros inválidos';
          throw new Error(`Validação falhou: ${message}`);
        }

        const message = axiosError.response?.data?.message || axiosError.message || 'Erro desconhecido';
        throw new Error(`Erro ao consultar comunicações: ${sanitizeError(new Error(message))}`);
      }

      throw new Error(`Erro ao consultar comunicações: ${sanitizeError(error)}`);
    }
  }

  async obterCertidao(hash: string): Promise<Buffer> {
    if (!hash || typeof hash !== 'string' || hash.trim().length === 0) {
      throw new Error('Hash inválido');
    }

    try {
      console.log('[ComunicaCNJClient] Obtendo certidão para hash:', hash);
      const response = await this.client.get(`/api/v1/comunicacao/${hash}/certidao`, {
        responseType: 'arraybuffer',
      });

      console.log('[ComunicaCNJClient] Resposta recebida:', {
        status: response.status,
        contentType: response.headers['content-type'],
        dataType: typeof response.data,
        dataLength: response.data?.byteLength || response.data?.length || 0,
        isBuffer: Buffer.isBuffer(response.data),
        isArrayBuffer: response.data instanceof ArrayBuffer,
      });

      let pdfBuffer: Buffer;
      if (Buffer.isBuffer(response.data)) {
        pdfBuffer = response.data;
      } else if (response.data instanceof ArrayBuffer) {
        pdfBuffer = Buffer.from(response.data);
      } else if (typeof response.data === 'string') {
        pdfBuffer = Buffer.from(response.data, 'binary');
      } else {
        pdfBuffer = Buffer.from(response.data as any);
      }

      if (!pdfBuffer || pdfBuffer.length === 0) {
        console.error('[ComunicaCNJClient] Certidão vazia - buffer length:', pdfBuffer?.length);
        throw new Error('Certidão vazia retornada pela API');
      }

      console.log('[ComunicaCNJClient] Certidão obtida com sucesso, tamanho:', pdfBuffer.length, 'bytes');
      return pdfBuffer;
    } catch (error) {
      console.error('[ComunicaCNJClient] Erro ao obter certidão:', error);
      if (axios.isAxiosError(error)) {
        console.error('[ComunicaCNJClient] Detalhes do erro axios:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          headers: error.response?.headers,
          data: error.response?.data ? (typeof error.response.data === 'string' ? error.response.data.substring(0, 200) : 'binary data') : 'no data',
        });
        if (error.response?.status === 404) {
          throw new Error('Certidão não encontrada');
        }
        throw new Error(`Erro ao obter certidão: ${sanitizeError(error)}`);
      }
      throw new Error(`Erro ao obter certidão: ${sanitizeError(error)}`);
    }
  }

  async listarTribunais(): Promise<TribunalCNJInfo[]> {
    try {
      const response = await this.client.get<TribunalCNJInfo[]>('/api/v1/comunicacao/tribunal');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      throw new Error(`Erro ao listar tribunais: ${sanitizeError(error)}`);
    }
  }

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
      const response = await this.client.get<CadernoMetadataAPI>(
        `/api/v1/caderno/${siglaTribunal}/${data}/${meio}`
      );

      const apiData = response.data;
      const now = new Date();
      const expiresAt = apiData.expires_at || apiData.expiresAt
        ? new Date(apiData.expires_at || apiData.expiresAt!)
        : new Date(now.getTime() + 5 * 60 * 1000);

      const normalized: CadernoMetadata = {
        tribunal: apiData.tribunal || apiData.sigla_tribunal || siglaTribunal,
        sigla: apiData.sigla || apiData.sigla_tribunal || siglaTribunal,
        meio: apiData.meio,
        data: apiData.data,
        totalComunicacoes: apiData.total_comunicacoes || apiData.totalComunicacoes || 0,
        url: apiData.url,
        expiresAt: expiresAt.toISOString(),
      };

      return normalized;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Caderno não encontrado para a data/tribunal especificados');
        }
        if (error.response?.status === 422) {
          throw new Error('Parâmetros inválidos');
        }
        throw new Error(`Erro ao obter caderno: ${sanitizeError(error)}`);
      }
      throw new Error(`Erro ao obter caderno: ${sanitizeError(error)}`);
    }
  }

  getRateLimitStatus(): RateLimitStatus {
    const state = rateLimitState.get(this.defaultRateLimitKey);
    if (!state) {
      return { limit: 0, remaining: 0 };
    }
    if (state.resetAt && state.resetAt.getTime() <= Date.now()) {
      rateLimitState.delete(this.defaultRateLimitKey);
      return { limit: 0, remaining: 0 };
    }
    return { limit: state.limit, remaining: state.remaining, resetAt: state.resetAt };
  }

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

    if (!hasFilter && (params.itensPorPagina === undefined || params.itensPorPagina > 5)) {
      throw new Error(
        'Pelo menos um filtro deve ser preenchido ou itensPorPagina deve ser ≤ 5 para busca sem filtros'
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

  private sanitizeParams(params: ComunicacaoAPIParams): Record<string, any> {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private updateRateLimitState(headers: any): void {
    const limit = headers['x-ratelimit-limit'] ? parseInt(headers['x-ratelimit-limit'], 10) : 0;
    const remaining = headers['x-ratelimit-remaining']
      ? parseInt(headers['x-ratelimit-remaining'], 10)
      : 0;
    const resetAt = headers['x-ratelimit-reset']
      ? new Date(parseInt(headers['x-ratelimit-reset'], 10) * 1000)
      : new Date(Date.now() + 60000);

    rateLimitState.set(this.defaultRateLimitKey, { limit, remaining, resetAt });
  }

  private extractRateLimitFromHeaders(headers: any): RateLimitStatus {
    const limit = headers['x-ratelimit-limit'] ? parseInt(headers['x-ratelimit-limit'], 10) : 0;
    const remaining = headers['x-ratelimit-remaining']
      ? parseInt(headers['x-ratelimit-remaining'], 10)
      : 0;
    const resetAt = headers['x-ratelimit-reset']
      ? new Date(parseInt(headers['x-ratelimit-reset'], 10) * 1000)
      : undefined;
    return { limit, remaining, resetAt };
  }

  private async waitForRateLimit(): Promise<void> {
    return new Promise(resolve => { setTimeout(resolve, 60000); });
  }
}

export function createComunicaCNJClientFromEnv(): ComunicaCNJClient {
  const config: ComunicaCNJConfig = {
    baseUrl: process.env.COMUNICA_CNJ_API_URL || 'https://comunicaapi.pje.jus.br/',
    timeout: process.env.COMUNICA_CNJ_REQUEST_TIMEOUT
      ? parseInt(process.env.COMUNICA_CNJ_REQUEST_TIMEOUT, 10)
      : 30000,
    maxRetries: process.env.COMUNICA_CNJ_MAX_RETRIES
      ? parseInt(process.env.COMUNICA_CNJ_MAX_RETRIES, 10)
      : 3,
  };
  return new ComunicaCNJClient(config);
}

let clientInstance: ComunicaCNJClient | null = null;
export function getComunicaCNJClient(): ComunicaCNJClient {
  if (!clientInstance) {
    clientInstance = createComunicaCNJClientFromEnv();
  }
  return clientInstance;
}
