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
  DifyRenameConversationRequest,
  DifyConversationVariablesResponse,
  DifyWorkflowLogsParams,
  DifyWorkflowLogsResponse,
  DifySpeechToTextResponse,
  DifyTextToAudioRequest,
  DifyFileUploadWorkflowResponse,
  DifyAnnotation,
  DifyAnnotationsResponse,
  DifyAnnotationCreateRequest,
  DifyAnnotationUpdateRequest,
  DifyAnnotationReplyEnableRequest,
  DifyAnnotationReplyStatusResponse,
  DifyAppFeedbacksResponse,
  DifyRetrieveRequest,
  DifyRetrieveResponse,
  DifyDocumentDetail,
  DifyDocumentUpdateTextRequest,
  DifyBatchEmbeddingStatusResponse,
  DifySegmentsResponse,
  DifySegmentCreateRequest,
  DifySegmentUpdateRequest,
  DifySegment,
  DifyChunk,
  DifyChunksResponse,
  DifyChunkCreateRequest,
  DifyTag,
  DifyTagsResponse,
  DifyTagCreateRequest,
  DifyTagBindRequest,
  DifyEmbeddingModelsResponse,
  DifyBatchStatusUpdateRequest,
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

  private async requestVoid(endpoint: string, options: RequestInit = {}): Promise<void> {
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
    } catch (error) {
      console.error(`[Dify] Request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  private async binaryRequest(endpoint: string, options: RequestInit = {}): Promise<ArrayBuffer> {
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

      return await response.arrayBuffer();
    } catch (error) {
      console.error(`[Dify] Binary request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  private async uploadRequest<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
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

      return (await response.json()) as T;
    } catch (error) {
      console.error(`[Dify] Upload failed for ${endpoint}:`, error);
      throw error;
    }
  }

  private async streamRequest(endpoint: string, body: Record<string, unknown>): Promise<ReadableStream<Uint8Array>> {
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
    const query = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v ?? '')])).toString();
    return this.request<DifyConversationsResponse>(`/conversations?${query}`);
  }

  async getMessages(params: { conversation_id: string; user: string; first_id?: string; limit?: number }): Promise<DifyMessagesResponse> {
    const query = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v ?? '')])).toString();
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
    return this.uploadRequest<DifyFileUploadResponse>('/files/upload', formData);
  }

  // --- App Info ---

  async getAppInfo(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/info');
  }

  async getAppMeta(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/meta');
  }

  async getAppParameters(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/parameters');
  }

  // --- Knowledge Base ---

  async listDatasets(params: { page?: number; limit?: number; keyword?: string; tag_ids?: string[] }): Promise<DifyDatasetsResponse> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.keyword) query.append('keyword', params.keyword);
    if (params.tag_ids) params.tag_ids.forEach(id => query.append('tag_ids', id));
    
    return this.request<DifyDatasetsResponse>(`/datasets?${query.toString()}`);
  }

  async createDataset(params: {
    name: string;
    description?: string;
    indexing_technique?: 'high_quality' | 'economy';
    permission?: 'only_me' | 'all_team_members' | 'partial_members';
  }): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/datasets', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getDataset(datasetId: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(`/datasets/${datasetId}`);
  }

  async updateDataset(datasetId: string, params: {
    name?: string;
    description?: string;
    indexing_technique?: 'high_quality' | 'economy';
    permission?: 'only_me' | 'all_team_members' | 'partial_members';
  }): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(`/datasets/${datasetId}`, {
      method: 'PATCH',
      body: JSON.stringify(params),
    });
  }

  async deleteDataset(datasetId: string): Promise<void> {
    return this.request<void>(`/datasets/${datasetId}`, {
      method: 'DELETE',
    });
  }

  async listDocuments(datasetId: string, params: { page?: number; limit?: number; keyword?: string }): Promise<Record<string, unknown>> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.keyword) query.append('keyword', params.keyword);
    
    return this.request<Record<string, unknown>>(`/datasets/${datasetId}/documents?${query.toString()}`);
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

  // =========================================================================
  // Conversations Extended
  // =========================================================================

  async renameConversation(
    conversationId: string,
    params: DifyRenameConversationRequest
  ): Promise<{ result: string }> {
    return this.request<{ result: string }>(`/conversations/${conversationId}/name`, {
      method: 'PATCH',
      body: JSON.stringify(params),
    });
  }

  async deleteConversation(conversationId: string, user: string): Promise<void> {
    return this.requestVoid(`/conversations/${conversationId}`, {
      method: 'DELETE',
      body: JSON.stringify({ user }),
    });
  }

  async getConversationMessages(
    conversationId: string,
    params: { user: string; first_id?: string; limit?: number }
  ): Promise<DifyMessagesResponse> {
    const query = new URLSearchParams();
    query.append('user', params.user);
    query.append('conversation_id', conversationId);
    if (params.first_id) query.append('first_id', params.first_id);
    if (params.limit) query.append('limit', params.limit.toString());
    return this.request<DifyMessagesResponse>(`/messages?${query.toString()}`);
  }

  async getConversationVariables(
    conversationId: string,
    params: { user: string }
  ): Promise<DifyConversationVariablesResponse> {
    const query = new URLSearchParams({ user: params.user });
    return this.request<DifyConversationVariablesResponse>(
      `/conversations/${conversationId}/variables?${query.toString()}`
    );
  }

  // =========================================================================
  // Completion Stop
  // =========================================================================

  async stopCompletionTask(taskId: string, user: string): Promise<{ result: string }> {
    return this.request<{ result: string }>(`/completion-messages/${taskId}/stop`, {
      method: 'POST',
      body: JSON.stringify({ user }),
    });
  }

  // =========================================================================
  // Workflow Logs
  // =========================================================================

  async getWorkflowLogs(params: DifyWorkflowLogsParams = {}): Promise<DifyWorkflowLogsResponse> {
    const query = new URLSearchParams();
    if (params.keyword) query.append('keyword', params.keyword);
    if (params.status) query.append('status', params.status);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    return this.request<DifyWorkflowLogsResponse>(`/workflows/logs?${query.toString()}`);
  }

  // =========================================================================
  // Audio API
  // =========================================================================

  async speechToText(file: File, user: string): Promise<DifySpeechToTextResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user', user);
    return this.uploadRequest<DifySpeechToTextResponse>('/audio/speech-to-text', formData);
  }

  async textToAudio(params: DifyTextToAudioRequest): Promise<ArrayBuffer> {
    return this.binaryRequest('/text-to-audio', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // =========================================================================
  // Files Extended
  // =========================================================================

  async getFilePreview(fileId: string): Promise<ArrayBuffer> {
    return this.binaryRequest(`/files/${fileId}/preview`);
  }

  async uploadFileWorkflow(file: File, user: string): Promise<DifyFileUploadWorkflowResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user', user);
    return this.uploadRequest<DifyFileUploadWorkflowResponse>('/files/upload-workflow', formData);
  }

  // =========================================================================
  // Annotations API
  // =========================================================================

  async listAnnotations(params: { page?: number; limit?: number } = {}): Promise<DifyAnnotationsResponse> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    return this.request<DifyAnnotationsResponse>(`/annotations?${query.toString()}`);
  }

  async createAnnotation(params: DifyAnnotationCreateRequest): Promise<DifyAnnotation> {
    return this.request<DifyAnnotation>('/annotations', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async updateAnnotation(
    annotationId: string,
    params: DifyAnnotationUpdateRequest
  ): Promise<DifyAnnotation> {
    return this.request<DifyAnnotation>(`/annotations/${annotationId}`, {
      method: 'PATCH',
      body: JSON.stringify(params),
    });
  }

  async deleteAnnotation(annotationId: string): Promise<void> {
    return this.requestVoid(`/annotations/${annotationId}`, {
      method: 'DELETE',
    });
  }

  async enableAnnotationReply(
    params: DifyAnnotationReplyEnableRequest
  ): Promise<{ job_id: string; job_status: string }> {
    return this.request<{ job_id: string; job_status: string }>(
      '/apps/annotation-reply/enable',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
  }

  async disableAnnotationReply(): Promise<{ job_id: string; job_status: string }> {
    return this.request<{ job_id: string; job_status: string }>(
      '/apps/annotation-reply/disable',
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    );
  }

  async getAnnotationReplyStatus(
    action: 'enable' | 'disable',
    jobId: string
  ): Promise<DifyAnnotationReplyStatusResponse> {
    return this.request<DifyAnnotationReplyStatusResponse>(
      `/apps/annotation-reply/${action}/status/${jobId}`
    );
  }

  // =========================================================================
  // App Feedbacks
  // =========================================================================

  async getAppFeedbacks(params: { page?: number; limit?: number } = {}): Promise<DifyAppFeedbacksResponse> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    return this.request<DifyAppFeedbacksResponse>(`/feedbacks?${query.toString()}`);
  }

  // =========================================================================
  // Knowledge Base Retrieve
  // =========================================================================

  async retrieveDataset(
    datasetId: string,
    params: DifyRetrieveRequest
  ): Promise<DifyRetrieveResponse> {
    return this.request<DifyRetrieveResponse>(`/datasets/${datasetId}/retrieve`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // =========================================================================
  // Documents Extended
  // =========================================================================

  async createDocumentByFile(
    datasetId: string,
    file: File,
    data?: { indexing_technique?: string; process_rule?: Record<string, unknown> }
  ): Promise<{ document: DifyDocument; batch: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (data) {
      formData.append('data', JSON.stringify(data));
    }
    return this.uploadRequest<{ document: DifyDocument; batch: string }>(
      `/datasets/${datasetId}/document/create-by-file`,
      formData
    );
  }

  async getDocumentDetail(documentId: string): Promise<DifyDocumentDetail> {
    return this.request<DifyDocumentDetail>(`/documents/${documentId}`);
  }

  async updateDocumentText(
    documentId: string,
    params: DifyDocumentUpdateTextRequest
  ): Promise<{ document: DifyDocument; batch: string }> {
    return this.request<{ document: DifyDocument; batch: string }>(`/documents/${documentId}/text`, {
      method: 'PATCH',
      body: JSON.stringify(params),
    });
  }

  async updateDocumentFile(
    documentId: string,
    file: File,
    data?: { process_rule?: Record<string, unknown> }
  ): Promise<{ document: DifyDocument; batch: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (data) {
      formData.append('data', JSON.stringify(data));
    }
    // uploadRequest uses POST, but we need PATCH here
    const url = `${this.baseUrl}/documents/${documentId}/file`;
    const headers = { Authorization: `Bearer ${this.apiKey}` };
    try {
      const response = await fetch(url, { method: 'PATCH', headers, body: formData });
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Dify API Upload Error (${response.status}): ${errorBody}`);
      }
      return (await response.json()) as { document: DifyDocument; batch: string };
    } catch (error) {
      console.error(`[Dify] Upload failed for /documents/${documentId}/file:`, error);
      throw error;
    }
  }

  async getBatchEmbeddingStatus(
    datasetId: string,
    batch: string
  ): Promise<DifyBatchEmbeddingStatusResponse> {
    const query = new URLSearchParams({ batch });
    return this.request<DifyBatchEmbeddingStatusResponse>(
      `/datasets/${datasetId}/documents/batch-embedding-status?${query.toString()}`
    );
  }

  // =========================================================================
  // Segments API
  // =========================================================================

  async listSegments(
    datasetId: string,
    documentId: string,
    params: { keyword?: string; status?: string } = {}
  ): Promise<DifySegmentsResponse> {
    const query = new URLSearchParams();
    if (params.keyword) query.append('keyword', params.keyword);
    if (params.status) query.append('status', params.status);
    return this.request<DifySegmentsResponse>(
      `/datasets/${datasetId}/documents/${documentId}/segments?${query.toString()}`
    );
  }

  async createSegments(
    datasetId: string,
    documentId: string,
    params: DifySegmentCreateRequest
  ): Promise<{ data: DifySegment[]; doc_form: string }> {
    return this.request<{ data: DifySegment[]; doc_form: string }>(
      `/datasets/${datasetId}/documents/${documentId}/segments`,
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
  }

  async updateSegment(
    datasetId: string,
    documentId: string,
    segmentId: string,
    params: DifySegmentUpdateRequest
  ): Promise<{ data: DifySegment; doc_form: string }> {
    return this.request<{ data: DifySegment; doc_form: string }>(
      `/datasets/${datasetId}/documents/${documentId}/segments/${segmentId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(params),
      }
    );
  }

  async deleteSegment(
    datasetId: string,
    documentId: string,
    segmentId: string
  ): Promise<{ result: string }> {
    return this.request<{ result: string }>(
      `/datasets/${datasetId}/documents/${documentId}/segments/${segmentId}`,
      {
        method: 'DELETE',
      }
    );
  }

  // =========================================================================
  // Chunks API
  // =========================================================================

  async getChunkDetail(chunkId: string): Promise<DifyChunk> {
    return this.request<DifyChunk>(`/chunks/${chunkId}`);
  }

  async updateChunk(chunkId: string, params: DifyChunkCreateRequest): Promise<DifyChunk> {
    return this.request<DifyChunk>(`/chunks/${chunkId}`, {
      method: 'PATCH',
      body: JSON.stringify(params),
    });
  }

  async deleteChunk(chunkId: string): Promise<{ result: string }> {
    return this.request<{ result: string }>(`/chunks/${chunkId}`, {
      method: 'DELETE',
    });
  }

  async createChildChunk(chunkId: string, params: DifyChunkCreateRequest): Promise<DifyChunk> {
    return this.request<DifyChunk>(`/chunks/${chunkId}/children`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async listChildChunks(
    chunkId: string,
    params: { page?: number; limit?: number } = {}
  ): Promise<DifyChunksResponse> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    return this.request<DifyChunksResponse>(`/chunks/${chunkId}/children?${query.toString()}`);
  }

  async updateChildChunk(
    parentChunkId: string,
    childChunkId: string,
    params: DifyChunkCreateRequest
  ): Promise<DifyChunk> {
    return this.request<DifyChunk>(`/chunks/${parentChunkId}/children/${childChunkId}`, {
      method: 'PATCH',
      body: JSON.stringify(params),
    });
  }

  async deleteChildChunk(
    parentChunkId: string,
    childChunkId: string
  ): Promise<{ result: string }> {
    return this.request<{ result: string }>(`/chunks/${parentChunkId}/children/${childChunkId}`, {
      method: 'DELETE',
    });
  }

  // =========================================================================
  // Tags API
  // =========================================================================

  async listTags(params: { type?: string } = {}): Promise<DifyTagsResponse> {
    const query = new URLSearchParams();
    if (params.type) query.append('type', params.type);
    return this.request<DifyTagsResponse>(`/tags?${query.toString()}`);
  }

  async createTag(params: DifyTagCreateRequest): Promise<DifyTag> {
    return this.request<DifyTag>('/tags', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async updateTag(tagId: string, params: { name: string }): Promise<DifyTag> {
    return this.request<DifyTag>(`/tags/${tagId}`, {
      method: 'PATCH',
      body: JSON.stringify(params),
    });
  }

  async deleteTag(tagId: string): Promise<void> {
    return this.requestVoid(`/tags/${tagId}`, {
      method: 'DELETE',
    });
  }

  async bindDatasetTag(datasetId: string, params: DifyTagBindRequest): Promise<void> {
    return this.requestVoid(`/datasets/${datasetId}/tags`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async listDatasetTags(datasetId: string): Promise<DifyTagsResponse> {
    return this.request<DifyTagsResponse>(`/datasets/${datasetId}/tags`);
  }

  async unbindDatasetTag(datasetId: string, tagId: string): Promise<void> {
    return this.requestVoid(`/datasets/${datasetId}/tags/${tagId}`, {
      method: 'DELETE',
    });
  }

  // =========================================================================
  // Models API
  // =========================================================================

  async listEmbeddingModels(): Promise<DifyEmbeddingModelsResponse> {
    return this.request<DifyEmbeddingModelsResponse>('/models/embedding');
  }

  // =========================================================================
  // Batch Operations
  // =========================================================================

  async batchUpdateDocumentStatus(params: DifyBatchStatusUpdateRequest): Promise<{ result: string }> {
    return this.request<{ result: string }>('/documents/batch-status', {
      method: 'PATCH',
      body: JSON.stringify(params),
    });
  }
}
