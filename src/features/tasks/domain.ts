/**
 * TAREFAS DOMAIN - Entidades e Validações
 * 
 * Define tipos, schemas Zod e regras de negócio puras para Tarefas
 */

import { z } from 'zod';

// =============================================================================
// ENUMS E TIPOS DO BANCO
// =============================================================================

/**
 * Status da tarefa (conforme enum no banco)
 */
export type StatusTarefaDB = 'pendente' | 'em_andamento' | 'concluida';

/**
 * Status da tarefa no frontend (mais flexível)
 */
export type TodoStatus = 'todo' | 'in-progress' | 'done' | 'canceled';

/**
 * Prioridade da tarefa
 */
export type TodoPriority = 'low' | 'medium' | 'high';

// =============================================================================
// SCHEMAS ZOD
// =============================================================================

/**
 * Schema para criar uma tarefa
 */
export const createTarefaSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório').max(500, 'Título muito longo'),
  descricao: z.string().optional(),
  status: z.enum(['pendente', 'em_andamento', 'concluida']).default('pendente'),
  prioridade: z.number().int().min(0).max(5).default(0),
  data_vencimento: z.string().optional(), // ISO date string
});

/**
 * Schema para atualizar uma tarefa
 */
export const updateTarefaSchema = z.object({
  id: z.number().int().positive(),
  titulo: z.string().min(1).max(500).optional(),
  descricao: z.string().optional().nullable(),
  status: z.enum(['pendente', 'em_andamento', 'concluida']).optional(),
  prioridade: z.number().int().min(0).max(5).optional(),
  data_vencimento: z.string().optional().nullable(),
  data_conclusao: z.string().optional().nullable(), // ISO date string
});

/**
 * Schema para listar tarefas (filtros)
 */
export const listarTarefasSchema = z.object({
  pagina: z.number().int().min(1).default(1),
  limite: z.number().int().min(1).max(100).default(20),
  busca: z.string().optional(),
  status: z.enum(['pendente', 'em_andamento', 'concluida']).optional(),
  prioridade: z.number().int().min(0).max(5).optional(),
});

// =============================================================================
// TIPOS TYPESCRIPT
// =============================================================================

/**
 * Input para criar tarefa
 */
export type CreateTarefaInput = z.infer<typeof createTarefaSchema>;

/**
 * Input para atualizar tarefa
 */
export type UpdateTarefaInput = z.infer<typeof updateTarefaSchema>;

/**
 * Parâmetros para listar tarefas
 */
export type ListarTarefasParams = z.infer<typeof listarTarefasSchema>;

/**
 * Tarefa do banco de dados
 */
export interface Tarefa {
  id: number;
  usuario_id: number;
  titulo: string;
  descricao: string | null;
  status: StatusTarefaDB;
  prioridade: number;
  data_vencimento: string | null; // ISO date string
  data_conclusao: string | null; // ISO timestamp
  created_at: string;
  updated_at: string;
}

// =============================================================================
// MAPEAMENTOS E UTILITÁRIOS
// =============================================================================

/**
 * Mapeia status do banco para status do frontend
 */
export function mapStatusDBToFrontend(status: StatusTarefaDB): TodoStatus {
  const map: Record<StatusTarefaDB, TodoStatus> = {
    pendente: 'todo',
    em_andamento: 'in-progress',
    concluida: 'done',
  };
  return map[status] || 'todo';
}

/**
 * Mapeia status do frontend para status do banco
 */
export function mapStatusFrontendToDB(status: TodoStatus): StatusTarefaDB {
  const map: Record<TodoStatus, StatusTarefaDB> = {
    todo: 'pendente',
    'in-progress': 'em_andamento',
    done: 'concluida',
    canceled: 'pendente', // canceled vira pendente no banco
  };
  return map[status];
}

/**
 * Mapeia prioridade numérica para prioridade do frontend
 */
export function mapPrioridadeToFrontend(prioridade: number): TodoPriority {
  if (prioridade >= 4) return 'high';
  if (prioridade >= 2) return 'medium';
  return 'low';
}

/**
 * Mapeia prioridade do frontend para numérica
 */
export function mapPrioridadeToDB(prioridade: TodoPriority): number {
  const map: Record<TodoPriority, number> = {
    low: 1,
    medium: 3,
    high: 5,
  };
  return map[prioridade];
}

/**
 * Labels para status
 */
export const statusLabels: Record<StatusTarefaDB, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
};

/**
 * Labels para prioridade
 */
export const prioridadeLabels: Record<TodoPriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

