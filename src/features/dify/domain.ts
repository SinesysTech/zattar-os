import { z } from 'zod';

// --- Enums ---

export enum TipoDifyApp {
  CHAT = 'chat',
  CHATFLOW = 'chatflow',
  WORKFLOW = 'workflow',
  COMPLETION = 'completion',
  AGENT = 'agent',
}

export enum StatusExecucaoDify {
  RUNNING = 'running',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  STOPPED = 'stopped',
}

// --- Schemas ---

export interface EnviarMensagemParams {
  query: string;
  conversation_id?: string;
  inputs: Record<string, unknown>;
  files?: unknown[];
  user?: string;
}

export const enviarMensagemSchema = z.object({
  query: z.string().min(1, 'A mensagem não pode estar vazia'),
  conversation_id: z.string().optional(),
  inputs: z.record(z.unknown()).default({}),
  files: z.array(z.unknown()).optional(), // Refinar tipo de arquivo se necessário
  user: z.string().optional(),
});

export interface ExecutarWorkflowParams {
  inputs: Record<string, unknown>;
  files?: unknown[];
  user?: string;
}

export const executarWorkflowSchema = z.object({
  inputs: z.record(z.unknown()).default({}),
  files: z.array(z.unknown()).optional(),
  user: z.string().optional(),
});

export const feedbackSchema = z.object({
  message_id: z.string(),
  rating: z.enum(['like', 'dislike']),
  content: z.string().optional(),
});

// --- Interfaces de Domínio ---

export interface DifyConversation {
  id: string;
  name: string;
  inputs: Record<string, unknown>;
  status: string;
  introduction: string;
  created_at: number;
  updated_at: number;
}

export interface DifyMessage {
  id: string;
  conversation_id: string;
  inputs: Record<string, unknown>;
  query: string;
  answer: string;
  created_at: number;
  feedback?: {
    rating: 'like' | 'dislike';
  };
}

export interface DifyWorkflowExecution {
  id: string;
  workflow_run_id: string;
  task_id?: string;
  status: StatusExecucaoDify;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  error?: string;
  elapsed_time: number;
  total_tokens: number;
  total_steps: number;
  created_at: Date;
  finished_at?: Date;
  usuario_id: string | number;
}

export interface DifyApp {
  id: string;
  name: string;
  api_url: string;
  api_key: string;
  app_type: TipoDifyApp | string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// --- Schemas Adicionais ---

export const criarDatasetSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
});

export const criarDocumentoSchema = z.object({
  datasetId: z.string().min(1, 'ID do dataset é obrigatório'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  texto: z.string().min(1, 'Texto é obrigatório'),
});

// --- Interfaces Adicionais ---

export interface DifyExecucaoWorkflow {
  id: string;
  workflow_id: string;
  workflow_run_id?: string;
  status: StatusExecucaoDify;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  created_at: string;
  finished_at: string | null;
  error?: string;
  elapsed_time?: number;
  total_tokens?: number;
  total_steps?: number;
}

// --- Labels ---

export const STATUS_EXECUCAO_LABELS: Record<StatusExecucaoDify, string> = {
  [StatusExecucaoDify.RUNNING]: 'Em execução',
  [StatusExecucaoDify.SUCCEEDED]: 'Concluído',
  [StatusExecucaoDify.FAILED]: 'Falhou',
  [StatusExecucaoDify.STOPPED]: 'Parado',
};
