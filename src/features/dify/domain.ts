import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export enum TipoDifyApp {
  Chat = 'chat',
  Workflow = 'workflow',
  Completion = 'completion',
  Agent = 'agent',
}

export enum StatusExecucao {
  Running = 'running',
  Succeeded = 'succeeded',
  Failed = 'failed',
  Stopped = 'stopped',
}

export enum FeedbackRating {
  Like = 'like',
  Dislike = 'dislike',
}

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

export const enviarMensagemSchema = z.object({
  query: z.string().min(1, 'Mensagem é obrigatória'),
  conversationId: z.string().optional(),
  inputs: z.record(z.string(), z.unknown()).optional(),
  files: z
    .array(
      z.object({
        type: z.enum(['image', 'document', 'audio', 'video']),
        transfer_method: z.enum(['remote_url', 'local_file']),
        url: z.string().optional(),
        upload_file_id: z.string().optional(),
      })
    )
    .optional(),
  autoGenerateName: z.boolean().optional().default(true),
});

export const executarWorkflowSchema = z.object({
  inputs: z.record(z.string(), z.unknown()),
  files: z
    .array(
      z.object({
        type: z.enum(['image', 'document', 'audio', 'video']),
        transfer_method: z.enum(['remote_url', 'local_file']),
        url: z.string().optional(),
        upload_file_id: z.string().optional(),
      })
    )
    .optional(),
});

export const completionSchema = z.object({
  inputs: z.record(z.string(), z.unknown()),
  files: z
    .array(
      z.object({
        type: z.enum(['image', 'document', 'audio', 'video']),
        transfer_method: z.enum(['remote_url', 'local_file']),
        url: z.string().optional(),
        upload_file_id: z.string().optional(),
      })
    )
    .optional(),
});

export const listarConversasSchema = z.object({
  limite: z.number().int().min(1).max(100).optional().default(20),
  lastId: z.string().optional(),
  ordenarPor: z
    .enum(['created_at', '-created_at', 'updated_at', '-updated_at'])
    .optional()
    .default('-updated_at'),
});

export const obterHistoricoSchema = z.object({
  conversationId: z.string().min(1, 'ID da conversa é obrigatório'),
  limite: z.number().int().min(1).max(100).optional().default(20),
  firstId: z.string().optional(),
});

export const enviarFeedbackSchema = z.object({
  messageId: z.string().min(1, 'ID da mensagem é obrigatório'),
  rating: z.enum(['like', 'dislike']).nullable(),
  conteudo: z.string().optional(),
});

export const criarDatasetSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  indexingTechnique: z.enum(['high_quality', 'economy']).optional().default('high_quality'),
  permissao: z.enum(['only_me', 'all_team_members']).optional().default('only_me'),
});

export const criarDocumentoSchema = z.object({
  datasetId: z.string().min(1, 'ID do dataset é obrigatório'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  texto: z.string().min(1, 'Texto é obrigatório'),
  indexingTechnique: z.enum(['high_quality', 'economy']).optional().default('high_quality'),
});

// ---------------------------------------------------------------------------
// Inferred Types
// ---------------------------------------------------------------------------

export type EnviarMensagemInput = z.infer<typeof enviarMensagemSchema>;
export type ExecutarWorkflowInput = z.infer<typeof executarWorkflowSchema>;
export type CompletionInput = z.infer<typeof completionSchema>;
export type ListarConversasInput = z.infer<typeof listarConversasSchema>;
export type ObterHistoricoInput = z.infer<typeof obterHistoricoSchema>;
export type EnviarFeedbackInput = z.infer<typeof enviarFeedbackSchema>;
export type CriarDatasetInput = z.infer<typeof criarDatasetSchema>;
export type CriarDocumentoInput = z.infer<typeof criarDocumentoSchema>;

// ---------------------------------------------------------------------------
// Domain Interfaces (camelCase)
// ---------------------------------------------------------------------------

export interface DifyConversaResumo {
  id: string;
  nome: string;
  status: string;
  criadoEm: number;
  atualizadoEm: number;
}

export interface DifyMensagem {
  id: string;
  conversationId: string;
  query: string;
  answer: string;
  arquivos: Array<{
    id: string;
    tipo: string;
    url: string;
    pertenceA: 'user' | 'assistant';
  }>;
  feedback: { rating: 'like' | 'dislike' | null } | null;
  fontes: Array<{
    posicao: number;
    datasetId: string;
    datasetNome: string;
    documentoId: string;
    documentoNome: string;
    segmentoId: string;
    score: number;
    conteudo: string;
  }>;
  criadoEm: number;
}

export interface DifyExecucaoWorkflow {
  id: string;
  workflowRunId: string;
  workflowId: string;
  taskId: string;
  status: StatusExecucao;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  erro: string | null;
  totalTokens: number;
  tempoDecorrido: number;
  totalPassos: number;
  criadoEm: number;
  finalizadoEm: number | null;
}

export interface DifyCompletionResult {
  messageId: string;
  answer: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    totalPrice: string;
    currency: string;
    latency: number;
  };
}

export interface DifyDatasetResumo {
  id: string;
  nome: string;
  descricao: string;
  quantidadeDocumentos: number;
  quantidadePalavras: number;
  criadoEm: number;
  atualizadoEm: number;
}

export interface DifyDocumentoResumo {
  id: string;
  nome: string;
  statusIndexacao: string;
  habilitado: boolean;
  tokens: number;
  quantidadePalavras: number;
  quantidadeHits: number;
  criadoEm: number;
}

// ---------------------------------------------------------------------------
// Database Row Types (snake_case)
// ---------------------------------------------------------------------------

export interface DifyExecucaoRow {
  id: string;
  workflow_run_id: string;
  workflow_id: string | null;
  task_id: string | null;
  status: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  error: string | null;
  total_tokens: number;
  elapsed_time: number;
  total_steps: number;
  usuario_id: number;
  created_at: string;
  finished_at: string | null;
}

export interface DifyConversaRow {
  id: string;
  conversation_id: string;
  app_key: string;
  nome: string | null;
  usuario_id: number;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Converters
// ---------------------------------------------------------------------------

export function converterParaDifyExecucao(row: DifyExecucaoRow): DifyExecucaoWorkflow {
  return {
    id: row.id,
    workflowRunId: row.workflow_run_id,
    workflowId: row.workflow_id || '',
    taskId: row.task_id || '',
    status: row.status as StatusExecucao,
    inputs: row.inputs,
    outputs: row.outputs,
    erro: row.error,
    totalTokens: row.total_tokens,
    tempoDecorrido: row.elapsed_time,
    totalPassos: row.total_steps,
    criadoEm: new Date(row.created_at).getTime() / 1000,
    finalizadoEm: row.finished_at ? new Date(row.finished_at).getTime() / 1000 : null,
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const STATUS_EXECUCAO_LABELS: Record<StatusExecucao, string> = {
  [StatusExecucao.Running]: 'Em execução',
  [StatusExecucao.Succeeded]: 'Concluído',
  [StatusExecucao.Failed]: 'Falhou',
  [StatusExecucao.Stopped]: 'Parado',
};

export const TIPO_APP_LABELS: Record<TipoDifyApp, string> = {
  [TipoDifyApp.Chat]: 'Chat',
  [TipoDifyApp.Workflow]: 'Workflow',
  [TipoDifyApp.Completion]: 'Completion',
  [TipoDifyApp.Agent]: 'Agente',
};
