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
