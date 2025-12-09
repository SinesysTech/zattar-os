/**
 * Cliente para integração com a API Sinesys
 * 
 * Camada de abstração para o app "Meu Processo" consumir dados do Sinesys.
 * Centraliza todas as chamadas à API e fornece métodos de alto nível.
 */

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface SinesysClientConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
  retries?: number;
}

export interface SinesysErrorResponse {
  error: string;
  details?: string;
  code?: string;
}

export class SinesysAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'SinesysAPIError';
  }
}

export interface SinesysProcessoResponse {
  success: boolean;
  data: { processos: Array<Record<string, unknown>>; [key: string]: unknown };
  total: number;
}

export interface SinesysAudienciasResponse {
  success: boolean;
  data: Record<string, unknown>[];
  total: number;
}

export interface SinesysClienteResponse {
  success: boolean;
  data: Record<string, unknown>;
}

export interface SinesysContratosResponse {
  success: boolean;
  data: { contratos: unknown[]; total: number; pagina: number; limite: number };
  total: number;
}

export interface SinesysAcordosResponse {
  success: boolean;
  data: { acordos: unknown[]; total: number; pagina: number; limite: number };
  total: number;
}

export class SinesysClient {
  private config: SinesysClientConfig;

  constructor(config: SinesysClientConfig) {
    this.config = {
      timeout: 30000, // 30s padrão
      retries: 2,
      ...config,
    };
  }

  /**
   * Método genérico de requisição HTTP
   */
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.timeout
    );

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'x-service-api-key': this.config.apiKey,
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      clearTimeout(timeoutId);

      // Tratamento de erros HTTP
      if (!response.ok) {
        let errorData: SinesysErrorResponse | null = null;
        try {
          errorData = await response.json();
        } catch {
          // Resposta não é JSON
        }

        throw new SinesysAPIError(
          errorData?.error || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData?.details,
          errorData?.code
        );
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof SinesysAPIError) {
        throw error;
      }

      if ((error as Error).name === 'AbortError') {
        throw new SinesysAPIError('Timeout na requisição', 408);
      }

      throw new SinesysAPIError(
        'Erro de rede ou servidor indisponível',
        0,
        (error as Error).message
      );
    }
  }

  /**
   * Método com retry automático
   */
  private async requestWithRetry<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    let lastError: Error | null = null;
    const maxRetries = this.config.retries || 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.request<T>(endpoint, options);
      } catch (error) {
        lastError = error as Error;

        // Não fazer retry em erros de cliente (4xx)
        if (
          error instanceof SinesysAPIError &&
          error.statusCode &&
          error.statusCode >= 400 &&
          error.statusCode < 500
        ) {
          throw error;
        }

        // Se não for a última tentativa, aguardar antes de tentar novamente
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  // ==========================================================================
  // MÉTODOS PÚBLICOS - BUSCA POR CPF
  // ==========================================================================

  /**
   * Busca processos de um cliente pelo CPF
   */
  async buscarProcessosPorCpf(
    cpf: string
  ): Promise<SinesysProcessoResponse> {
    const cpfLimpo = cpf.replace(/\D/g, '');
    return this.requestWithRetry<SinesysProcessoResponse>(
      `/api/acervo/cliente/cpf/${cpfLimpo}`
    );
  }

  /**
   * Busca audiências de um cliente pelo CPF
   */
  async buscarAudienciasPorCpf(
    cpf: string
  ): Promise<SinesysAudienciasResponse> {
    const cpfLimpo = cpf.replace(/\D/g, '');
    return this.requestWithRetry<SinesysAudienciasResponse>(
      `/api/audiencias/cliente/cpf/${cpfLimpo}`
    );
  }

  /**
   * Busca dados cadastrais de um cliente pelo CPF
   */
  async buscarClientePorCpf(cpf: string): Promise<SinesysClienteResponse> {
    const cpfLimpo = cpf.replace(/\D/g, '');
    return this.requestWithRetry<SinesysClienteResponse>(
      `/api/clientes/buscar/por-cpf/${cpfLimpo}`
    );
  }

  /**
   * Busca contratos de um cliente pelo ID
   * 
   * NOTA: A API de contratos não aceita CPF diretamente.
   * É necessário primeiro buscar o cliente para obter o ID.
   */
  async buscarContratosPorClienteId(
    clienteId: number,
    options?: { pagina?: number; limite?: number }
  ): Promise<SinesysContratosResponse> {
    const params = new URLSearchParams();
    params.append('clienteId', clienteId.toString());

    if (options?.pagina) {
      params.append('pagina', options.pagina.toString());
    }
    if (options?.limite) {
      params.append('limite', options.limite.toString());
    }

    return this.requestWithRetry<SinesysContratosResponse>(
      `/api/contratos?${params.toString()}`
    );
  }

  /**
   * Busca contratos de um cliente pelo CPF
   * 
   * Este método faz 2 chamadas:
   * 1. Busca o cliente pelo CPF para obter o ID
   * 2. Busca os contratos usando o ID
   */
  async buscarContratosPorCpf(
    cpf: string,
    options?: { pagina?: number; limite?: number }
  ): Promise<SinesysContratosResponse> {
    try {
      const clienteResponse = await this.buscarClientePorCpf(cpf);

      if (!clienteResponse.success || !clienteResponse.data.id) {
        return {
          success: true,
          data: {
            contratos: [],
            total: 0,
            pagina: 1,
            limite: 50,
          },
        };
      }

      return this.buscarContratosPorClienteId(clienteResponse.data.id, options);
    } catch (error) {
      // Se cliente não encontrado, retornar lista vazia ao invés de erro
      if (error instanceof SinesysAPIError && error.statusCode === 404) {
        return {
          success: true,
          data: {
            contratos: [],
            total: 0,
            pagina: 1,
            limite: 50,
          },
        };
      }
      throw error;
    }
  }

  /**
   * Busca acordos/condenações de um processo pelo ID
   */
  async buscarAcordosPorProcessoId(
    processoId: number,
    options?: { pagina?: number; limite?: number }
  ): Promise<SinesysAcordosResponse> {
    const params = new URLSearchParams();
    params.append('processoId', processoId.toString());

    if (options?.pagina) {
      params.append('pagina', options.pagina.toString());
    }
    if (options?.limite) {
      params.append('limite', options.limite.toString());
    }

    return this.requestWithRetry<SinesysAcordosResponse>(
      `/api/acordos-condenacoes?${params.toString()}`
    );
  }

  /**
   * Busca todos os dados de um cliente pelo CPF
   * 
   * Faz múltiplas chamadas em paralelo para obter:
   * - Processos
   * - Audiências
   * - Contratos
   * 
   * NOTA: Acordos não são buscados aqui pois requerem processo_id.
   * Devem ser buscados posteriormente se necessário.
   */
  async buscarDadosClientePorCpf(cpf: string) {
    const cpfLimpo = cpf.replace(/\D/g, '');

    // Buscar dados em paralelo
    const [processos, audiencias, contratos] = await Promise.allSettled([
      this.buscarProcessosPorCpf(cpfLimpo),
      this.buscarAudienciasPorCpf(cpfLimpo),
      this.buscarContratosPorCpf(cpfLimpo),
    ]);

    return {
      processos:
        processos.status === 'fulfilled'
          ? processos.value
          : { success: false, error: (processos.reason as Error).message },
      audiencias:
        audiencias.status === 'fulfilled'
          ? audiencias.value
          : { success: false, error: (audiencias.reason as Error).message },
      contratos:
        contratos.status === 'fulfilled'
          ? contratos.value
          : { success: false, error: (contratos.reason as Error).message },
    };
  }

  /**
   * Busca acordos de todos os processos de um cliente
   * 
   * NOTA: Este método pode fazer múltiplas chamadas (uma por processo).
   * Use com cuidado em clientes com muitos processos.
   */
  async buscarAcordosDoCliente(cpf: string): Promise<SinesysAcordosResponse> {
    // Primeiro buscar processos do cliente
    const processosResponse = await this.buscarProcessosPorCpf(cpf);

    if (!processosResponse.success || !processosResponse.data.processos.length) {
      return {
        success: true,
        data: {
          acordos: [],
          total: 0,
          pagina: 1,
          limite: 50,
        },
      };
    }

    // Buscar acordos de cada processo em paralelo
    const acordosPromises = processosResponse.data.processos.map(async (processo) => {
      // IMPORTANTE: Precisamos do processo_id numérico, não do número do processo
      // Por ora, vamos simular que o campo existe - DEVE SER AJUSTADO conforme API real
      const processoId = processo.id || processo.processo_id;

      if (!processoId) {
        return { success: true, data: { acordos: [], total: 0, pagina: 1, limite: 50 } };
      }

      try {
        return await this.buscarAcordosPorProcessoId(processoId);
      } catch (error) {
        // Ignorar erros individuais de processos
        return { success: true, data: { acordos: [], total: 0, pagina: 1, limite: 50 } };
      }
    });

    const acordosResults = await Promise.allSettled(acordosPromises);

    // Agregar todos os acordos
    const todosAcordos = acordosResults
      .filter((result) => result.status === 'fulfilled')
      .flatMap((result) => (result as PromiseFulfilledResult<SinesysAcordosResponse>).value.data.acordos);

    return {
      success: true,
      data: {
        acordos: todosAcordos,
        total: todosAcordos.length,
        pagina: 1,
        limite: todosAcordos.length,
      },
    };
  }
}

// =============================================================================
// INSTÂNCIA SINGLETON
// =============================================================================

/**
 * Instância pré-configurada do cliente Sinesys
 * Usa variáveis de ambiente para configuração
 */
export const sinesysClient = new SinesysClient({
  baseUrl: process.env.NEXT_PUBLIC_SINESYS_API_URL || 'http://localhost:3000',
  apiKey: process.env.SINESYS_SERVICE_API_KEY || '',
  timeout: parseInt(process.env.SINESYS_TIMEOUT || '30000', 10),
  retries: parseInt(process.env.SINESYS_RETRIES || '2', 10),
});
