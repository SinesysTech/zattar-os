import { z } from 'zod';

// --- Enums ---

export enum TipoDifyApp {
  CHAT = 'chat',
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

export const enviarMensagemSchema = z.object({
  query: z.string().min(1, 'A mensagem não pode estar vazia'),
  conversation_id: z.string().optional(),
  inputs: z.record(z.any()).default({}),
  files: z.array(z.any()).optional(), // Refinar tipo de arquivo se necessário
  user: z.string().optional(),
});

export const executarWorkflowSchema = z.object({
  inputs: z.record(z.any()).default({}),
  files: z.array(z.any()).optional(),
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
  inputs: Record<string, any>;
  status: string;
  introduction: string;
  created_at: number;
  updated_at: number;
}

export interface DifyMessage {
  id: string;
  conversation_id: string;
  inputs: Record<string, any>;
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
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  error?: string;
  elapsed_time: number;
  total_tokens: number;
  total_steps: number;
  created_at: Date;
  finished_at?: Date;
  usuario_id: number;
}
