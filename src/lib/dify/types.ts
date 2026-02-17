export interface DifyUser {
  inputs: Record<string, unknown>;
  query: string;
  response_mode: 'blocking' | 'streaming';
  conversation_id?: string;
  user: string;
  files?: DifyFile[];
}

export interface DifyFile {
  type: 'image';
  transfer_method: 'remote_url' | 'local_file';
  url?: string;
  upload_file_id?: string;
}

// Chat API
export interface DifyChatRequest {
  inputs: Record<string, unknown>;
  query: string;
  response_mode: 'blocking' | 'streaming';
  conversation_id?: string;
  user: string;
  files?: DifyFile[];
  auto_generate_name?: boolean;
}

export interface DifyChatResponse {
  event?: string;
  task_id: string;
  id: string;
  message_id: string;
  conversation_id: string;
  mode: string;
  answer: string;
  metadata: {
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    retriever_resources?: Array<{
      position: number;
      dataset_id: string;
      dataset_name: string;
      document_id: string;
      document_name: string;
      segment_id: string;
      score: number;
      content: string;
    }>;
  };
  created_at: number;
}

// Workflow API
export interface DifyWorkflowRequest {
  inputs: Record<string, unknown>;
  response_mode: 'blocking' | 'streaming';
  user: string;
  files?: DifyFile[];
}

export interface DifyWorkflowResponse {
  workflow_run_id: string;
  task_id: string;
  data: {
    id: string;
    workflow_id: string;
    status: 'succeeded' | 'failed' | 'stopped';
    outputs: Record<string, unknown>;
    error?: string;
    elapsed_time: number;
    total_tokens: number;
    total_steps: number;
    created_at: number;
    finished_at: number;
  };
}

// Completion API
export interface DifyCompletionRequest {
  inputs: Record<string, unknown>;
  response_mode: 'blocking' | 'streaming';
  user: string;
  files?: DifyFile[];
}

export interface DifyCompletionResponse {
  message_id: string;
  conversation_id: string;
  mode: string;
  answer: string;
  metadata: Record<string, unknown>;
  created_at: number;
}

// Common Responses
export interface DifyConversationsResponse {
  data: Array<{
    id: string;
    name: string;
    inputs: Record<string, unknown>
    status: string;
    introduction: string;
    created_at: number;
    updated_at: number;
  }>;
  has_more: boolean;
  limit: number;
}

export interface DifyMessagesResponse {
  data: Array<{
    id: string;
    conversation_id: string;
    inputs: Record<string, unknown>;
    query: string;
    message_files: Array<Record<string, unknown>>;
    answer: string;
    created_at: number;
    feedback?: {
      rating: 'like' | 'dislike';
    };
  }>;
  has_more: boolean;
  limit: number;
}

export interface DifyFeedbackRequest {
  rating: 'like' | 'dislike';
  user: string;
  content?: string;
}

export interface DifyFileUploadResponse {
  id: string;
  name: string;
  size: number;
  extension: string;
  mime_type: string;
  created_by: string;
  created_at: number;
}

// Knowledge Base
export interface DifyDataset {
  id: string;
  name: string;
  description: string;
  permission: string;
  created_at: number;
}

export interface DifyDatasetsResponse {
  data: DifyDataset[];
  has_more: boolean;
  limit: number;
  total: number;
  page: number;
}

export interface DifyDocument {
  id: string;
  position: number;
  data_source_type: string;
  data_source_info: Record<string, unknown>;
  dataset_process_rule_id: string;
  name: string;
  created_from: string;
  created_by: string;
  created_at: number;
  tokens: number;
  indexing_status: string;
  error: string;
  enabled: boolean;
  disabled_at: number;
  disabled_by: string;
  archived: boolean;
}

export interface DifyDocumentCreateRequest {
  name: string;
  text: string;
  indexing_technique?: 'high_quality' | 'economy';
  process_rule?: Record<string, unknown>;
}

// SSE Events
export type DifyStreamEventType =
  | 'message'
  | 'message_end'
  | 'message_replace'
  | 'agent_message'
  | 'agent_thought'
  | 'workflow_started'
  | 'node_started'
  | 'node_finished'
  | 'workflow_finished'
  | 'error'
  | 'ping';

export interface DifyStreamEvent {
  event: DifyStreamEventType;
  task_id?: string;
  message_id?: string;
  conversation_id?: string;
  answer?: string;
  created_at?: number;
  data?: Record<string, unknown>; // For workflow events
  metadata?: Record<string, unknown>;
}

// =========================================================================
// Conversations Extended
// =========================================================================

export interface DifyRenameConversationRequest {
  name: string;
  auto_generate: boolean;
  user: string;
}

export interface DifyConversationVariablesResponse {
  data: Array<{
    id: string;
    name: string;
    value_type: string;
    value: unknown;
    description: string;
    updated_at: number;
    created_at: number;
  }>;
  has_more: boolean;
  limit: number;
}

// =========================================================================
// Workflow Logs
// =========================================================================

export interface DifyWorkflowLogsParams {
  keyword?: string;
  status?: 'succeeded' | 'failed' | 'stopped' | 'running';
  page?: number;
  limit?: number;
}

export interface DifyWorkflowLog {
  id: string;
  workflow_run: {
    id: string;
    version: string;
    status: string;
    error?: string;
    elapsed_time: number;
    total_tokens: number;
    total_steps: number;
    created_at: number;
    finished_at: number;
  };
  created_from: string;
  created_by_role: string;
  created_by_account: string;
  created_by_end_user: {
    id: string;
    type: string;
    is_anonymous: boolean;
    session_id: string;
  };
  created_at: number;
}

export interface DifyWorkflowLogsResponse {
  data: DifyWorkflowLog[];
  has_more: boolean;
  limit: number;
  total: number;
  page: number;
}

// =========================================================================
// Audio API
// =========================================================================

export interface DifySpeechToTextResponse {
  text: string;
}

export interface DifyTextToAudioRequest {
  text?: string;
  message_id?: string;
  user: string;
  streaming?: boolean;
}

// =========================================================================
// Files Extended
// =========================================================================

export interface DifyFileUploadWorkflowResponse {
  id: string;
  name: string;
  size: number;
  extension: string;
  mime_type: string;
  created_by: string;
  created_at: number;
}

// =========================================================================
// Annotations API
// =========================================================================

export interface DifyAnnotation {
  id: string;
  question: string;
  answer: string;
  hit_count: number;
  created_at: number;
  updated_at: number;
}

export interface DifyAnnotationsResponse {
  data: DifyAnnotation[];
  has_more: boolean;
  limit: number;
  total: number;
  page: number;
}

export interface DifyAnnotationCreateRequest {
  question: string;
  answer: string;
}

export interface DifyAnnotationUpdateRequest {
  question: string;
  answer: string;
}

export interface DifyAnnotationReplyEnableRequest {
  embedding_provider_name: string;
  embedding_model_name: string;
  score_threshold: number;
}

export interface DifyAnnotationReplyStatusResponse {
  job_id: string;
  job_status: 'waiting' | 'processing' | 'completed' | 'error';
  error_msg?: string;
}

// =========================================================================
// App Feedbacks
// =========================================================================

export interface DifyAppFeedback {
  id: string;
  username: string;
  phone: string;
  rating: 'like' | 'dislike';
  content: string;
  created_at: number;
  updated_at: number;
}

export interface DifyAppFeedbacksResponse {
  data: DifyAppFeedback[];
  has_more: boolean;
  limit: number;
  total: number;
  page: number;
}

// =========================================================================
// Knowledge Base Retrieve
// =========================================================================

export interface DifyRetrieveRequest {
  query: string;
  retrieval_model?: {
    search_method: 'keyword_search' | 'semantic_search' | 'full_text_search' | 'hybrid_search';
    reranking_enable?: boolean;
    reranking_mode?: string;
    top_k?: number;
    score_threshold_enabled?: boolean;
    score_threshold?: number;
  };
  external_retrieval_model?: {
    external_knowledge_id: string;
    external_knowledge_api_id: string;
  };
}

export interface DifyRetrieveRecord {
  segment: {
    id: string;
    position: number;
    document_id: string;
    content: string;
    answer?: string;
    word_count: number;
    tokens: number;
    keywords: string[];
    index_node_id: string;
    index_node_hash: string;
    hit_count: number;
    enabled: boolean;
    disabled_at?: number;
    disabled_by?: string;
    status: string;
    created_by: string;
    created_at: number;
    indexing_at: number;
    completed_at: number;
    error?: string;
    stopped_at?: number;
    document: {
      id: string;
      data_source_type: string;
      name: string;
      doc_type?: string;
    };
  };
  score: number;
  tsne_position?: { x: number; y: number };
}

export interface DifyRetrieveResponse {
  query: { content: string };
  records: DifyRetrieveRecord[];
}

// =========================================================================
// Documents Extended
// =========================================================================

export interface DifyDocumentDetail extends DifyDocument {
  display_status: string;
  word_count: number;
  hit_count: number;
  doc_form: string;
}

export interface DifyDocumentUpdateTextRequest {
  name?: string;
  text?: string;
  process_rule?: Record<string, unknown>;
}

export interface DifyBatchEmbeddingStatusResponse {
  data: Array<{
    indexing_status: string;
    processing_started_at?: number;
    parsing_completed_at?: number;
    cleaning_completed_at?: number;
    splitting_completed_at?: number;
    completed_at?: number;
    paused_at?: number;
    error?: string;
    stopped_at?: number;
    completed_segments?: number;
    total_segments?: number;
  }>;
}

// =========================================================================
// Segments API
// =========================================================================

export interface DifySegment {
  id: string;
  position: number;
  document_id: string;
  content: string;
  answer?: string;
  word_count: number;
  tokens: number;
  keywords: string[];
  index_node_id: string;
  index_node_hash: string;
  hit_count: number;
  enabled: boolean;
  status: string;
  created_by: string;
  created_at: number;
  indexing_at: number;
  completed_at: number;
  error?: string;
}

export interface DifySegmentsResponse {
  data: DifySegment[];
  has_more: boolean;
  limit: number;
  total: number;
  doc_form: string;
}

export interface DifySegmentCreateRequest {
  segments: Array<{
    content: string;
    answer?: string;
    keywords?: string[];
  }>;
}

export interface DifySegmentUpdateRequest {
  segment: {
    content: string;
    answer?: string;
    keywords?: string[];
    enabled?: boolean;
  };
}

// =========================================================================
// Chunks API
// =========================================================================

export interface DifyChunk {
  id: string;
  content: string;
  type: string;
  word_count: number;
  tokens: number;
  position: number;
  created_at: number;
  updated_at: number;
}

export interface DifyChunksResponse {
  data: DifyChunk[];
  has_more: boolean;
  limit: number;
  total: number;
}

export interface DifyChunkCreateRequest {
  content: string;
}

// =========================================================================
// Tags API
// =========================================================================

export interface DifyTag {
  id: string;
  name: string;
  type: string;
  binding_count: number;
  created_at: number;
}

export interface DifyTagsResponse {
  data: DifyTag[];
  has_more: boolean;
  limit: number;
  total: number;
}

export interface DifyTagCreateRequest {
  name: string;
  type?: string;
}

export interface DifyTagBindRequest {
  tag_ids: string[];
}

// =========================================================================
// Models API
// =========================================================================

export interface DifyEmbeddingModel {
  provider: string;
  label: Record<string, string>;
  icon_small: Record<string, string>;
  icon_large: Record<string, string>;
  status: string;
  models: Array<{
    model: string;
    label: Record<string, string>;
    model_type: string;
    features?: string[];
    fetch_from: string;
    model_properties: Record<string, unknown>;
    deprecated: boolean;
    status: string;
  }>;
}

export interface DifyEmbeddingModelsResponse {
  data: DifyEmbeddingModel[];
}

// =========================================================================
// Batch Operations
// =========================================================================

export interface DifyBatchStatusUpdateRequest {
  document_ids: string[];
  enabled: boolean;
}
