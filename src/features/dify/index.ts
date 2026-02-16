/**
 * DIFY FEATURE - Public API
 *
 * Integração completa com a plataforma Dify AI.
 * Inclui chat conversacional, execução de workflows, completion,
 * e gestão de knowledge base.
 *
 * @example
 * ```tsx
 * import {
 *   DifyChatPanel,
 *   WorkflowRunner,
 *   actionEnviarMensagemDify,
 *   actionExecutarWorkflowDify,
 *   TipoDifyApp,
 *   StatusExecucao,
 * } from '@/features/dify';
 * ```
 */

// =============================================================================
// TYPES & SCHEMAS
// =============================================================================
export type {
  EnviarMensagemInput,
  ExecutarWorkflowInput,
  CompletionInput,
  ListarConversasInput,
  ObterHistoricoInput,
  EnviarFeedbackInput,
  CriarDatasetInput,
  CriarDocumentoInput,
  DifyConversaResumo,
  DifyMensagem,
  DifyExecucaoWorkflow,
  DifyCompletionResult,
  DifyDatasetResumo,
  DifyDocumentoResumo,
  DifyExecucaoRow,
  DifyConversaRow,
} from './domain';

export {
  TipoDifyApp,
  StatusExecucao,
  FeedbackRating,
  enviarMensagemSchema,
  executarWorkflowSchema,
  completionSchema,
  listarConversasSchema,
  obterHistoricoSchema,
  enviarFeedbackSchema,
  criarDatasetSchema,
  criarDocumentoSchema,
  STATUS_EXECUCAO_LABELS,
  TIPO_APP_LABELS,
} from './domain';

// =============================================================================
// ACTIONS
// =============================================================================
export {
  actionEnviarMensagemDify,
  actionListarConversasDify,
  actionObterHistoricoDify,
  actionEnviarFeedbackDify,
} from './actions/chat-actions';

export {
  actionExecutarWorkflowDify,
  actionPararTarefaDify,
  actionListarExecucoesDify,
} from './actions/workflow-actions';

export {
  actionCriarDatasetDify,
  actionListarDatasetsDify,
  actionCriarDocumentoDify,
  actionListarDocumentosDify,
} from './actions/knowledge-actions';

// =============================================================================
// HOOKS
// =============================================================================
export { useDifyChat } from './hooks/use-dify-chat';
export { useDifyWorkflow } from './hooks/use-dify-workflow';

// =============================================================================
// COMPONENTS
// =============================================================================
export { DifyChatPanel } from './components/dify-chat/dify-chat-panel';
export { DifyMessage } from './components/dify-chat/dify-message';
export { WorkflowRunner } from './components/dify-workflows/workflow-runner';
export { WorkflowHistory } from './components/dify-workflows/workflow-history';
