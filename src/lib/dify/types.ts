// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type DifyResponseMode = 'streaming' | 'blocking';

export interface DifyInputFileObject {
  type: 'image' | 'document' | 'audio' | 'video';
  transfer_method: 'remote_url' | 'local_file';
  url?: string;
  upload_file_id?: string;
}

export interface DifyUsage {
  prompt_tokens: number;
  prompt_unit_price: string;
  prompt_price_unit: string;
  prompt_price: string;
  completion_tokens: number;
  completion_unit_price: string;
  completion_price_unit: string;
  completion_price: string;
  total_tokens: number;
  total_price: string;
  currency: string;
  latency: number;
}

export interface DifyRetrieverResource {
  position: number;
  dataset_id: string;
  dataset_name: string;
  document_id: string;
  document_name: string;
  segment_id: string;
  score: number;
  content: string;
}

// ---------------------------------------------------------------------------
// Chat Messages
// ---------------------------------------------------------------------------

export interface DifyChatRequest {
  query: string;
  user: string;
  inputs?: Record<string, unknown>;
  response_mode?: DifyResponseMode;
  conversation_id?: string;
  files?: DifyInputFileObject[];
  auto_generate_name?: boolean;
}

export interface DifyChatBlockingResponse {
  event: 'message';
  task_id: string;
  id: string;
  message_id: string;
  conversation_id: string;
  mode: string;
  answer: string;
  metadata: {
    usage: DifyUsage;
    retriever_resources: DifyRetrieverResource[];
  };
  created_at: number;
}

// ---------------------------------------------------------------------------
// Completion Messages
// ---------------------------------------------------------------------------

export interface DifyCompletionRequest {
  inputs: Record<string, unknown>;
  user: string;
  response_mode?: DifyResponseMode;
  files?: DifyInputFileObject[];
}

export interface DifyCompletionBlockingResponse {
  event: 'message';
  task_id: string;
  id: string;
  message_id: string;
  mode: string;
  answer: string;
  metadata: {
    usage: DifyUsage;
    retriever_resources: DifyRetrieverResource[];
  };
  created_at: number;
}

// ---------------------------------------------------------------------------
// Workflow
// ---------------------------------------------------------------------------

export interface DifyWorkflowRequest {
  inputs: Record<string, unknown>;
  user: string;
  response_mode?: DifyResponseMode;
  files?: DifyInputFileObject[];
}

export interface DifyWorkflowBlockingResponse {
  workflow_run_id: string;
  task_id: string;
  data: {
    id: string;
    workflow_id: string;
    status: 'running' | 'succeeded' | 'failed' | 'stopped';
    outputs: Record<string, unknown>;
    error: string | null;
    elapsed_time: number;
    total_tokens: number;
    total_steps: number;
    created_at: number;
    finished_at: number | null;
  };
}

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

export interface DifyConversationsRequest {
  user: string;
  last_id?: string;
  limit?: number;
  sort_by?: 'created_at' | '-created_at' | 'updated_at' | '-updated_at';
}

export interface DifyConversation {
  id: string;
  name: string;
  inputs: Record<string, unknown>;
  status: string;
  introduction: string;
  created_at: number;
  updated_at: number;
}

export interface DifyConversationsResponse {
  limit: number;
  has_more: boolean;
  data: DifyConversation[];
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export interface DifyMessagesRequest {
  conversation_id: string;
  user: string;
  first_id?: string;
  limit?: number;
}

export interface DifyMessageFile {
  id: string;
  type: string;
  url: string;
  belongs_to: 'user' | 'assistant';
}

export interface DifyMessage {
  id: string;
  conversation_id: string;
  inputs: Record<string, unknown>;
  query: string;
  answer: string;
  message_files: DifyMessageFile[];
  feedback: { rating: 'like' | 'dislike' | null } | null;
  retriever_resources: DifyRetrieverResource[];
  created_at: number;
}

export interface DifyMessagesResponse {
  limit: number;
  has_more: boolean;
  data: DifyMessage[];
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

export interface DifyFeedbackRequest {
  rating: 'like' | 'dislike' | null;
  user: string;
  content?: string;
}

// ---------------------------------------------------------------------------
// Suggested Questions
// ---------------------------------------------------------------------------

export interface DifySuggestedQuestionsResponse {
  result: string;
  data: string[];
}

// ---------------------------------------------------------------------------
// File Upload
// ---------------------------------------------------------------------------

export interface DifyFileUploadResponse {
  id: string;
  name: string;
  size: number;
  extension: string;
  mime_type: string;
  created_by: string;
  created_at: number;
}

// ---------------------------------------------------------------------------
// App Info & Parameters
// ---------------------------------------------------------------------------

export interface DifyAppInfo {
  name: string;
  description: string;
  tags: string[];
}

export interface DifyAppParameter {
  opening_statement: string;
  suggested_questions: string[];
  suggested_questions_after_answer: { enabled: boolean };
  speech_to_text: { enabled: boolean };
  retriever_resource: { enabled: boolean };
  annotation_reply: { enabled: boolean };
  user_input_form: Array<{
    [key: string]: {
      label: string;
      variable: string;
      required: boolean;
      max_length?: number;
      default?: string;
      options?: string[];
    };
  }>;
  file_upload: {
    image: {
      enabled: boolean;
      number_limits: number;
      transfer_methods: string[];
    };
  };
  system_parameters: {
    file_size_limit: number;
    image_file_size_limit: number;
    audio_file_size_limit: number;
    video_file_size_limit: number;
  };
}

export interface DifyAppMeta {
  tool_icons: Record<string, string | { background: string; content: string }>;
}

// ---------------------------------------------------------------------------
// Knowledge Base (Datasets)
// ---------------------------------------------------------------------------

export interface DifyDataset {
  id: string;
  name: string;
  description: string;
  provider: string;
  permission: 'only_me' | 'all_team_members';
  data_source_type: string;
  indexing_technique: 'high_quality' | 'economy';
  app_count: number;
  document_count: number;
  word_count: number;
  created_by: string;
  created_at: number;
  updated_by: string;
  updated_at: number;
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
  error: string | null;
  enabled: boolean;
  disabled_at: number | null;
  disabled_by: string | null;
  archived: boolean;
  display_status: string;
  word_count: number;
  hit_count: number;
  doc_form: string;
}

export interface DifyCreateDatasetRequest {
  name: string;
  description?: string;
  indexing_technique?: 'high_quality' | 'economy';
  permission?: 'only_me' | 'all_team_members';
}

export interface DifyCreateDocumentRequest {
  name: string;
  text: string;
  indexing_technique?: 'high_quality' | 'economy';
  process_rule?: {
    mode: 'automatic' | 'custom';
    rules?: {
      pre_processing_rules?: Array<{ id: string; enabled: boolean }>;
      segmentation?: { separator: string; max_tokens: number };
    };
  };
}

// ---------------------------------------------------------------------------
// SSE Stream Events
// ---------------------------------------------------------------------------

export type DifyStreamEventType =
  | 'message'
  | 'message_end'
  | 'message_replace'
  | 'tts_message'
  | 'tts_message_end'
  | 'agent_message'
  | 'agent_thought'
  | 'message_file'
  | 'error'
  | 'ping'
  | 'workflow_started'
  | 'node_started'
  | 'node_finished'
  | 'workflow_finished';

export interface DifyStreamEventBase {
  event: DifyStreamEventType;
  task_id?: string;
  message_id?: string;
  conversation_id?: string;
}

export interface DifyStreamMessageEvent extends DifyStreamEventBase {
  event: 'message' | 'agent_message';
  id: string;
  answer: string;
  created_at: number;
}

export interface DifyStreamMessageEndEvent extends DifyStreamEventBase {
  event: 'message_end';
  id: string;
  metadata: {
    usage: DifyUsage;
    retriever_resources: DifyRetrieverResource[];
  };
}

export interface DifyStreamErrorEvent extends DifyStreamEventBase {
  event: 'error';
  status: number;
  code: string;
  message: string;
}

export interface DifyStreamWorkflowStartedEvent extends DifyStreamEventBase {
  event: 'workflow_started';
  workflow_run_id: string;
  data: {
    id: string;
    workflow_id: string;
    sequence_number: number;
    created_at: number;
  };
}

export interface DifyStreamNodeStartedEvent extends DifyStreamEventBase {
  event: 'node_started';
  workflow_run_id: string;
  data: {
    id: string;
    node_id: string;
    node_type: string;
    title: string;
    index: number;
    predecessor_node_id: string | null;
    inputs: Record<string, unknown>;
    created_at: number;
  };
}

export interface DifyStreamNodeFinishedEvent extends DifyStreamEventBase {
  event: 'node_finished';
  workflow_run_id: string;
  data: {
    id: string;
    node_id: string;
    node_type: string;
    title: string;
    index: number;
    inputs: Record<string, unknown>;
    outputs: Record<string, unknown>;
    status: string;
    error: string | null;
    elapsed_time: number;
    execution_metadata: Record<string, unknown>;
    created_at: number;
  };
}

export interface DifyStreamWorkflowFinishedEvent extends DifyStreamEventBase {
  event: 'workflow_finished';
  workflow_run_id: string;
  data: {
    id: string;
    workflow_id: string;
    status: 'running' | 'succeeded' | 'failed' | 'stopped';
    outputs: Record<string, unknown>;
    error: string | null;
    elapsed_time: number;
    total_tokens: number;
    total_steps: number;
    created_at: number;
    finished_at: number;
  };
}

export interface DifyStreamAgentThoughtEvent extends DifyStreamEventBase {
  event: 'agent_thought';
  id: string;
  position: number;
  thought: string;
  observation: string;
  tool: string;
  tool_labels: Record<string, unknown>;
  tool_input: string;
  message_files: string[];
  created_at: number;
}

export interface DifyStreamMessageFileEvent extends DifyStreamEventBase {
  event: 'message_file';
  id: string;
  type: string;
  belongs_to: string;
  url: string;
}

export type DifyStreamEvent =
  | DifyStreamMessageEvent
  | DifyStreamMessageEndEvent
  | DifyStreamErrorEvent
  | DifyStreamWorkflowStartedEvent
  | DifyStreamNodeStartedEvent
  | DifyStreamNodeFinishedEvent
  | DifyStreamWorkflowFinishedEvent
  | DifyStreamAgentThoughtEvent
  | DifyStreamMessageFileEvent
  | DifyStreamEventBase;

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export interface DifyApiError {
  status: number;
  code: string;
  message: string;
}

export class DifyError extends Error {
  status: number;
  code: string;

  constructor(apiError: DifyApiError) {
    super(apiError.message);
    this.name = 'DifyError';
    this.status = apiError.status;
    this.code = apiError.code;
  }
}
