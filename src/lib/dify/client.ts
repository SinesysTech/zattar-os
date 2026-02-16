import {
  getDifyConfig,
  getApiKeyForApp,
  DIFY_REQUEST_TIMEOUT,
  DIFY_STREAM_TIMEOUT,
  DIFY_MAX_RETRIES,
} from './config';
import { DifyError } from './types';
import type {
  DifyChatRequest,
  DifyChatBlockingResponse,
  DifyCompletionRequest,
  DifyCompletionBlockingResponse,
  DifyWorkflowRequest,
  DifyWorkflowBlockingResponse,
  DifyConversationsRequest,
  DifyConversationsResponse,
  DifyMessagesRequest,
  DifyMessagesResponse,
  DifyFeedbackRequest,
  DifySuggestedQuestionsResponse,
  DifyFileUploadResponse,
  DifyAppInfo,
  DifyAppParameter,
  DifyAppMeta,
  DifyCreateDatasetRequest,
  DifyDataset,
  DifyCreateDocumentRequest,
  DifyDocument,
  DifyStreamEvent,
} from './types';
import { parseDifySSEStream } from './stream';

// ---------------------------------------------------------------------------
// Dify API Client
// ---------------------------------------------------------------------------

export class DifyClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(options?: { apiKey?: string; baseUrl?: string }) {
    const config = getDifyConfig();
    this.baseUrl = (options?.baseUrl || config.DIFY_API_URL).replace(/\/$/, '');
    this.apiKey = options?.apiKey || config.DIFY_API_KEY || '';
  }

  // -------------------------------------------------------------------------
  // Chat Messages
  // -------------------------------------------------------------------------

  /**
   * Envia uma mensagem de chat (modo blocking).
   */
  async chatMessages(params: DifyChatRequest): Promise<DifyChatBlockingResponse> {
    return this.post<DifyChatBlockingResponse>('/chat-messages', {
      ...params,
      response_mode: 'blocking',
    });
  }

  /**
   * Envia uma mensagem de chat (modo streaming).
   * Retorna um ReadableStream de eventos SSE.
   */
  async chatMessagesStream(params: DifyChatRequest): Promise<ReadableStream<DifyStreamEvent>> {
    const response = await this.rawPost('/chat-messages', {
      ...params,
      response_mode: 'streaming',
    }, DIFY_STREAM_TIMEOUT);

    return parseDifySSEStream(response);
  }

  // -------------------------------------------------------------------------
  // Completion Messages
  // -------------------------------------------------------------------------

  /**
   * Gera uma completion (modo blocking).
   */
  async completionMessages(params: DifyCompletionRequest): Promise<DifyCompletionBlockingResponse> {
    return this.post<DifyCompletionBlockingResponse>('/completion-messages', {
      ...params,
      response_mode: 'blocking',
    });
  }

  /**
   * Gera uma completion (modo streaming).
   */
  async completionMessagesStream(params: DifyCompletionRequest): Promise<ReadableStream<DifyStreamEvent>> {
    const response = await this.rawPost('/completion-messages', {
      ...params,
      response_mode: 'streaming',
    }, DIFY_STREAM_TIMEOUT);

    return parseDifySSEStream(response);
  }

  // -------------------------------------------------------------------------
  // Workflows
  // -------------------------------------------------------------------------

  /**
   * Executa um workflow (modo blocking).
   */
  async workflowRun(params: DifyWorkflowRequest): Promise<DifyWorkflowBlockingResponse> {
    return this.post<DifyWorkflowBlockingResponse>('/workflows/run', {
      ...params,
      response_mode: 'blocking',
    });
  }

  /**
   * Executa um workflow (modo streaming).
   */
  async workflowRunStream(params: DifyWorkflowRequest): Promise<ReadableStream<DifyStreamEvent>> {
    const response = await this.rawPost('/workflows/run', {
      ...params,
      response_mode: 'streaming',
    }, DIFY_STREAM_TIMEOUT);

    return parseDifySSEStream(response);
  }

  // -------------------------------------------------------------------------
  // Task Control
  // -------------------------------------------------------------------------

  /**
   * Para a geração de uma tarefa.
   */
  async stopTask(taskId: string, user: string): Promise<{ result: string }> {
    return this.post<{ result: string }>(`/chat-messages/${taskId}/stop`, { user });
  }

  // -------------------------------------------------------------------------
  // Conversations
  // -------------------------------------------------------------------------

  /**
   * Lista conversas do usuário.
   */
  async getConversations(params: DifyConversationsRequest): Promise<DifyConversationsResponse> {
    const searchParams = new URLSearchParams({ user: params.user });
    if (params.last_id) searchParams.set('last_id', params.last_id);
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.sort_by) searchParams.set('sort_by', params.sort_by);

    return this.get<DifyConversationsResponse>(`/conversations?${searchParams}`);
  }

  /**
   * Deleta uma conversa.
   */
  async deleteConversation(conversationId: string, user: string): Promise<void> {
    await this.delete(`/conversations/${conversationId}`, { user });
  }

  /**
   * Renomeia uma conversa.
   */
  async renameConversation(
    conversationId: string,
    name: string,
    user: string
  ): Promise<void> {
    await this.post(`/conversations/${conversationId}/name`, { name, user });
  }

  // -------------------------------------------------------------------------
  // Messages
  // -------------------------------------------------------------------------

  /**
   * Obtém o histórico de mensagens de uma conversa.
   */
  async getMessages(params: DifyMessagesRequest): Promise<DifyMessagesResponse> {
    const searchParams = new URLSearchParams({
      conversation_id: params.conversation_id,
      user: params.user,
    });
    if (params.first_id) searchParams.set('first_id', params.first_id);
    if (params.limit) searchParams.set('limit', String(params.limit));

    return this.get<DifyMessagesResponse>(`/messages?${searchParams}`);
  }

  // -------------------------------------------------------------------------
  // Feedback
  // -------------------------------------------------------------------------

  /**
   * Envia feedback (like/dislike) para uma mensagem.
   */
  async sendFeedback(messageId: string, feedback: DifyFeedbackRequest): Promise<{ result: string }> {
    return this.post<{ result: string }>(`/messages/${messageId}/feedbacks`, feedback);
  }

  // -------------------------------------------------------------------------
  // Suggested Questions
  // -------------------------------------------------------------------------

  /**
   * Obtém perguntas sugeridas após uma mensagem.
   */
  async getSuggestedQuestions(messageId: string, user: string): Promise<DifySuggestedQuestionsResponse> {
    return this.get<DifySuggestedQuestionsResponse>(`/messages/${messageId}/suggested?user=${encodeURIComponent(user)}`);
  }

  // -------------------------------------------------------------------------
  // File Upload
  // -------------------------------------------------------------------------

  /**
   * Faz upload de um arquivo para o Dify.
   */
  async uploadFile(file: File, user: string): Promise<DifyFileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user', user);

    const response = await fetch(`${this.baseUrl}/files/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: formData,
      signal: AbortSignal.timeout(DIFY_REQUEST_TIMEOUT),
    });

    if (!response.ok) {
      await this.handleError(response);
    }

    return response.json();
  }

  // -------------------------------------------------------------------------
  // App Info
  // -------------------------------------------------------------------------

  /**
   * Obtém informações do app.
   */
  async getAppInfo(): Promise<DifyAppInfo> {
    return this.get<DifyAppInfo>('/info');
  }

  /**
   * Obtém os parâmetros do app (opening statement, forms, etc.).
   */
  async getAppParameters(): Promise<DifyAppParameter> {
    return this.get<DifyAppParameter>('/parameters');
  }

  /**
   * Obtém metadados do app.
   */
  async getAppMeta(): Promise<DifyAppMeta> {
    return this.get<DifyAppMeta>('/meta');
  }

  // -------------------------------------------------------------------------
  // Knowledge Base (Datasets)
  // -------------------------------------------------------------------------

  /**
   * Cria um novo dataset (knowledge base).
   */
  async createDataset(params: DifyCreateDatasetRequest): Promise<DifyDataset> {
    return this.post<DifyDataset>('/datasets', params);
  }

  /**
   * Lista datasets.
   */
  async listDatasets(page = 1, limit = 20): Promise<{ data: DifyDataset[]; has_more: boolean; limit: number; total: number; page: number }> {
    return this.get(`/datasets?page=${page}&limit=${limit}`);
  }

  /**
   * Cria um documento em um dataset via texto.
   */
  async createDocumentByText(
    datasetId: string,
    params: DifyCreateDocumentRequest
  ): Promise<{ document: DifyDocument; batch: string }> {
    return this.post(`/datasets/${datasetId}/document/create-by-text`, params);
  }

  /**
   * Deleta um documento de um dataset.
   */
  async deleteDocument(datasetId: string, documentId: string): Promise<{ result: string }> {
    return this.delete(`/datasets/${datasetId}/documents/${documentId}`);
  }

  /**
   * Lista documentos de um dataset.
   */
  async listDocuments(
    datasetId: string,
    page = 1,
    limit = 20
  ): Promise<{ data: DifyDocument[]; has_more: boolean; limit: number; total: number; page: number }> {
    return this.get(`/datasets/${datasetId}/documents?page=${page}&limit=${limit}`);
  }

  // -------------------------------------------------------------------------
  // HTTP helpers
  // -------------------------------------------------------------------------

  private async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  private async delete<T = void>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('DELETE', path, body);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    timeout = DIFY_REQUEST_TIMEOUT
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < DIFY_MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}${path}`, {
          method,
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: AbortSignal.timeout(timeout),
        });

        if (!response.ok) {
          await this.handleError(response);
        }

        // DELETE may return empty body
        const text = await response.text();
        if (!text) return undefined as T;
        return JSON.parse(text) as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on client errors (4xx)
        if (error instanceof DifyError && error.status >= 400 && error.status < 500) {
          throw error;
        }

        // Exponential backoff for retryable errors
        if (attempt < DIFY_MAX_RETRIES - 1) {
          const delay = Math.min(1000 * 2 ** attempt, 10000);
          console.warn(`[Dify] Tentativa ${attempt + 1} falhou, retentando em ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    throw lastError || new Error('Erro desconhecido ao chamar API Dify');
  }

  /**
   * Faz uma request POST e retorna a Response raw (para streaming).
   */
  private async rawPost(
    path: string,
    body: unknown,
    timeout = DIFY_STREAM_TIMEOUT
  ): Promise<Response> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeout),
    });

    if (!response.ok) {
      await this.handleError(response);
    }

    return response;
  }

  private async handleError(response: Response): Promise<never> {
    let errorBody: { code?: string; message?: string } = {};
    try {
      errorBody = await response.json();
    } catch {
      // Response may not be JSON
    }

    throw new DifyError({
      status: response.status,
      code: errorBody.code || `HTTP_${response.status}`,
      message: errorBody.message || `Erro HTTP ${response.status}: ${response.statusText}`,
    });
  }
}

// ---------------------------------------------------------------------------
// Factory functions
// ---------------------------------------------------------------------------

/**
 * Cria um DifyClient para o app de chat.
 */
export function createDifyChatClient(): DifyClient {
  const apiKey = getApiKeyForApp('chat');
  if (!apiKey) throw new Error('[Dify] API key para chat não configurada');
  return new DifyClient({ apiKey });
}

/**
 * Cria um DifyClient para workflows.
 */
export function createDifyWorkflowClient(): DifyClient {
  const apiKey = getApiKeyForApp('workflow');
  if (!apiKey) throw new Error('[Dify] API key para workflow não configurada');
  return new DifyClient({ apiKey });
}

/**
 * Cria um DifyClient com a API key padrão.
 */
export function createDifyClient(apiKey?: string): DifyClient {
  const key = apiKey || getApiKeyForApp('default');
  if (!key) throw new Error('[Dify] API key não configurada');
  return new DifyClient({ apiKey: key });
}
