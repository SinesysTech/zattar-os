// ---------------------------------------------------------------------------
// Dify AI Platform - Public API
// ---------------------------------------------------------------------------

// Config
export { getDifyConfig, isDifyConfigured, getApiKeyForApp } from './config';
export {
  DIFY_DEFAULT_URL,
  DIFY_REQUEST_TIMEOUT,
  DIFY_STREAM_TIMEOUT,
  DIFY_MAX_RETRIES,
} from './config';

// Client
export { DifyClient, createDifyClient, createDifyChatClient, createDifyWorkflowClient } from './client';

// Stream utilities
export { parseDifySSEStream, difyStreamToSSE, collectStreamAnswer, collectWorkflowStreamResult } from './stream';

// Types
export { DifyError } from './types';
export type {
  DifyResponseMode,
  DifyInputFileObject,
  DifyUsage,
  DifyRetrieverResource,
  DifyChatRequest,
  DifyChatBlockingResponse,
  DifyCompletionRequest,
  DifyCompletionBlockingResponse,
  DifyWorkflowRequest,
  DifyWorkflowBlockingResponse,
  DifyConversationsRequest,
  DifyConversation,
  DifyConversationsResponse,
  DifyMessagesRequest,
  DifyMessage,
  DifyMessageFile,
  DifyMessagesResponse,
  DifyFeedbackRequest,
  DifySuggestedQuestionsResponse,
  DifyFileUploadResponse,
  DifyAppInfo,
  DifyAppParameter,
  DifyAppMeta,
  DifyDataset,
  DifyDocument,
  DifyCreateDatasetRequest,
  DifyCreateDocumentRequest,
  DifyStreamEvent,
  DifyStreamEventType,
  DifyStreamMessageEvent,
  DifyStreamMessageEndEvent,
  DifyStreamErrorEvent,
  DifyStreamWorkflowStartedEvent,
  DifyStreamNodeStartedEvent,
  DifyStreamNodeFinishedEvent,
  DifyStreamWorkflowFinishedEvent,
  DifyStreamAgentThoughtEvent,
  DifyStreamMessageFileEvent,
  DifyApiError,
} from './types';
