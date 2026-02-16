import { getDifyConfig, DIFY_DEFAULT_URL } from './config';
import {
  DifyChatRequest,
  DifyChatResponse,
  DifyCompletionRequest,
  DifyCompletionResponse,
  DifyConversationsResponse,
  DifyFeedbackRequest,
  DifyFileUploadResponse,
  DifyMessagesResponse,
  DifyWorkflowRequest,
  DifyWorkflowResponse,
  DifyDatasetsResponse,
  DifyDocumentCreateRequest,
  DifyDocument,
} from './types';

export class DifyClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(apiKey?: string, baseUrl?: string) {
    const config = getDifyConfig();
    this.baseUrl = baseUrl || config.DIFY_API_URL || DIFY_DEFAULT_URL;
    // Prioriza a key passada no construtor, senão usa a key padrão
    this.apiKey = apiKey || config.DIFY_API_KEY || ''; // Deve ser passado ou configurado globalmente

    if (!this.apiKey) {
      console.warn('DifyClient inicializado sem API Key. As chamadas falharão se não autenticadas.');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
      ...options.headers,
    };

    try {
      const response = await fetch(url, { ...options, headers });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Dify API Error (${response.status}): ${errorBody}`);
      }

      return await response.json() as T;
    } catch (error) {
      console.error(`[Dify] Request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  private async streamRequest(endpoint: string, body: any): Promise<ReadableStream<Uint8Array>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Dify API Streaming Error (${response.status}): ${errorBody}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      return response.body;
    } catch (error) {
      console.error(`[Dify] Stream request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // --- Chat ---

  async chatMessages(params: DifyChatRequest): Promise<DifyChatResponse> {
    return this.request<DifyChatResponse>('/chat-messages', {
      method: 'POST',
      body: JSON.stringify({ ...params, response_mode: 'blocking' }),
    });
  }

  async chatMessagesStream(params: DifyChatRequest): Promise<ReadableStream<Uint8Array>> {
    return this.streamRequest('/chat-messages', { ...params, response_mode: 'streaming' });
  }

  async stopChatTask(taskId: string, user: string): Promise<{ result: string }> {
    return this.request<{ result: string }>(`/chat-messages/${taskId}/stop`, {
      method: 'POST',
      body: JSON.stringify({ user }),
    });
  }

  // --- Workflows ---

  async workflowRun(params: DifyWorkflowRequest): Promise<DifyWorkflowResponse> {
    return this.request<DifyWorkflowResponse>('/workflows/run', {
      method: 'POST',
      body: JSON.stringify({ ...params, response_mode: 'blocking' }),
    });
  }

  async workflowRunStream(params: DifyWorkflowRequest): Promise<ReadableStream<Uint8Array>> {
    return this.streamRequest('/workflows/run', { ...params, response_mode: 'streaming' });
  }

  async getWorkflowRunStatus(workflowRunId: string): Promise<DifyWorkflowResponse> {
    return this.request<DifyWorkflowResponse>(`/workflows/run/${workflowRunId}`);
  }

  async stopWorkflowRun(taskId: string, user: string): Promise<{ result: string }> {
    return this.request<{ result: string }>(`/workflows/run/${taskId}/stop`, {
      method: 'POST',
      body: JSON.stringify({ user }),
    });
  }

  // --- Completion ---

  async completionMessages(params: DifyCompletionRequest): Promise<DifyCompletionResponse> {
    return this.request<DifyCompletionResponse>('/completion-messages', {
      method: 'POST',
      body: JSON.stringify({ ...params, response_mode: 'blocking' }),
    });
  }

  async completionMessagesStream(params: DifyCompletionRequest): Promise<ReadableStream<Uint8Array>> {
    return this.streamRequest('/completion-messages', { ...params, response_mode: 'streaming' });
  }

  // --- Messages & Feedback ---

  async getConversations(params: { user: string; last_id?: string; limit?: number; pinned?: boolean }): Promise<DifyConversationsResponse> {
    const query = new URLSearchParams(params as any).toString();
    return this.request<DifyConversationsResponse>(`/conversations?${query}`);
  }

  async getMessages(params: { conversation_id: string; user: string; first_id?: string; limit?: number }): Promise<DifyMessagesResponse> {
    const query = new URLSearchParams(params as any).toString();
    return this.request<DifyMessagesResponse>(`/messages?${query}`);
  }

  async sendFeedback(messageId: string, params: DifyFeedbackRequest): Promise<{ result: string }> {
    return this.request<{ result: string }>(`/messages/${messageId}/feedbacks`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getSuggestedQuestions(messageId: string, user: string): Promise<{ data: string[] }> {
    return this.request<{ data: string[] }>(`/messages/${messageId}/suggested?user=${user}`);
  }

  // --- Files ---

  async uploadFile(file: File, user: string): Promise<DifyFileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user', user);

    const url = `${this.baseUrl}/files/upload`;
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Dify API Upload Error (${response.status}): ${errorBody}`);
      }
      return await response.json() as DifyFileUploadResponse;

    } catch (error) {
      console.error(`[Dify] Upload failed:`, error);
      throw error;
    }
  }

  // --- App Info ---

  async getAppInfo(): Promise<any> {
    return this.request<any>('/info');
  }

  async getAppMeta(): Promise<any> {
    return this.request<any>('/meta');
  }

  async getAppParameters(): Promise<any> {
    return this.request<any>('/parameters');
  }

  // --- Knowledge Base ---

  async listDatasets(params: { page?: number; limit?: number }): Promise<DifyDatasetsResponse> {
    const query = new URLSearchParams(params as any).toString();
    return this.request<DifyDatasetsResponse>(`/datasets?${query}`);
  }

  async createDocument(datasetId: string, params: DifyDocumentCreateRequest): Promise<DifyDocument> {
    return this.request<DifyDocument>(`/datasets/${datasetId}/document/create_by_text`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async deleteDocument(datasetId: string, documentId: string): Promise<{ result: string }> {
    return this.request<{ result: string }>(`/datasets/${datasetId}/documents/${documentId}`, {
      method: 'DELETE',
    });
  }
}
