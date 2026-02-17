/**
 * TAREFAS DOMAIN (TEMPLATE TASKS + EVENTOS)
 *
 * Domínio do módulo de tarefas alinhado ao template de Tarefas (TanStack Table)
 * com suporte a eventos virtuais (audiências, expedientes, perícias, obrigações).
 */

import { z } from "zod";
import type { EventSource } from "@/lib/event-aggregation/domain";

export const taskStatusSchema = z.enum(["backlog", "todo", "in progress", "done", "canceled"]);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

export const taskLabelSchema = z.enum(["bug", "feature", "documentation", "audiencia", "expediente", "pericia", "obrigacao"]);
export type TaskLabel = z.infer<typeof taskLabelSchema>;

export const taskPrioritySchema = z.enum(["low", "medium", "high"]);
export type TaskPriority = z.infer<typeof taskPrioritySchema>;


// =============================================================================
// SUB-ENTITIES (From To-Do Module)
// =============================================================================

export const taskAssigneeSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  email: z.string().email().optional(),
  avatarUrl: z.string().optional().nullable(),
});
export type TaskAssignee = z.infer<typeof taskAssigneeSchema>;

export const taskSubTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  completed: z.boolean(),
  position: z.number().int().min(0),
});
export type TaskSubTask = z.infer<typeof taskSubTaskSchema>;

export const taskCommentSchema = z.object({
  id: z.string().min(1),
  body: z.string().min(1),
  createdAt: z.string().min(1),
});
export type TaskComment = z.infer<typeof taskCommentSchema>;

export const taskFileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  url: z.string().min(1),
  type: z.string().optional().nullable(),
  size: z.number().int().optional().nullable(),
  uploadedAt: z.string().min(1),
});
export type TaskFile = z.infer<typeof taskFileSchema>;

/**
 * Entidade usada pela UI (mesmo contrato do template em `data/schema.ts`)
 */
export const taskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: taskStatusSchema,
  label: taskLabelSchema,
  priority: taskPrioritySchema,
  // New Fields from To-Do
  description: z.string().optional(),
  dueDate: z.string().optional().nullable(), // yyyy-mm-dd
  reminderDate: z.string().optional().nullable(), // timestamptz iso
  starred: z.boolean().default(false),
  assignees: z.array(taskAssigneeSchema).default([]),
  assignedTo: z.array(z.string()).default([]), // For backward compatibility if needed
  subTasks: z.array(taskSubTaskSchema).default([]),
  comments: z.array(taskCommentSchema).default([]),
  files: z.array(taskFileSchema).default([]),
  // Kanban fields
  position: z.number().int().min(0).default(0).optional(),
  quadroId: z.string().uuid().optional().nullable(), // null = quadro sistema
  // Virtual events
  source: z.string().optional().nullable(), // from eventSourceSchema
  sourceEntityId: z.string().optional().nullable(),
});
export type Task = z.infer<typeof taskSchema>;

/**
 * Tipo display unificado: task manual OU evento virtual.
 */
export interface TarefaDisplayItem extends Task {
  url?: string;
  isVirtual?: boolean;
  prazoVencido?: boolean;
  responsavelNome?: string;
  date?: string;
}

/**
 * Criação: id é gerado no banco (ex: TASK-0001)
 */
export const createTaskSchema = taskSchema.omit({ id: true, source: true, sourceEntityId: true }).partial({
  assignees: true,
  assignedTo: true,
  subTasks: true,
  comments: true,
  files: true,
  starred: true,
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).optional(),
  status: taskStatusSchema.optional(),
  label: taskLabelSchema.optional(),
  priority: taskPrioritySchema.optional(),
  description: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  reminderDate: z.string().optional().nullable(),
  starred: z.boolean().optional(),
});
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const listTasksSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  search: z.string().optional(),
  status: taskStatusSchema.optional(),
  label: taskLabelSchema.optional(),
  priority: taskPrioritySchema.optional(),
});
export type ListTasksParams = z.infer<typeof listTasksSchema>;

// =============================================================================
// ACTION INPUTS (From To-Do Module)
// =============================================================================

export const createSubTaskSchema = z.object({
  taskId: z.string().min(1),
  title: z.string().min(1),
});
export type CreateSubTaskInput = z.infer<typeof createSubTaskSchema>;

export const updateSubTaskSchema = z.object({
  taskId: z.string().min(1),
  subTaskId: z.string().min(1),
  completed: z.boolean(),
});
export type UpdateSubTaskInput = z.infer<typeof updateSubTaskSchema>;

export const deleteSubTaskSchema = z.object({
  taskId: z.string().min(1),
  subTaskId: z.string().min(1),
});
export type DeleteSubTaskInput = z.infer<typeof deleteSubTaskSchema>;

export const addCommentSchema = z.object({
  taskId: z.string().min(1),
  body: z.string().min(1),
});
export type AddCommentInput = z.infer<typeof addCommentSchema>;

export const deleteCommentSchema = z.object({
  taskId: z.string().min(1),
  commentId: z.string().min(1),
});
export type DeleteCommentInput = z.infer<typeof deleteCommentSchema>;

export const addFileSchema = z.object({
  taskId: z.string().min(1),
  name: z.string().min(1),
  url: z.string().min(1),
  type: z.string().optional(),
  size: z.number().optional(),
});
export type AddFileInput = z.infer<typeof addFileSchema>;

export const removeFileSchema = z.object({
  taskId: z.string().min(1),
  fileId: z.string().min(1),
});
export type RemoveFileInput = z.infer<typeof removeFileSchema>;

// =============================================================================
// QUADROS (KANBAN BOARDS)
// =============================================================================

export const quadroTipoSchema = z.enum(["sistema", "custom"]);
export type QuadroTipo = z.infer<typeof quadroTipoSchema>;

export const quadroSourceSchema = z.enum(["expedientes", "audiencias", "pericias", "obrigacoes"]);
export type QuadroSource = z.infer<typeof quadroSourceSchema>;

export const quadroSchema = z.object({
  id: z.string().uuid(),
  usuarioId: z.number().int().positive(),
  titulo: z.string().min(1),
  tipo: quadroTipoSchema,
  source: quadroSourceSchema.nullable(),
  icone: z.string().optional(),
  ordem: z.number().int().min(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Quadro = z.infer<typeof quadroSchema>;

/**
 * Quadros sistema (constantes) - aparecem para todos os usuários
 */
export const QUADROS_SISTEMA: Omit<Quadro, "usuarioId" | "createdAt" | "updatedAt">[] = [
  {
    id: "sys-expedientes",
    titulo: "Expedientes",
    tipo: "sistema",
    source: "expedientes",
    icone: "FileText",
    ordem: 0,
  },
  {
    id: "sys-audiencias",
    titulo: "Audiências",
    tipo: "sistema",
    source: "audiencias",
    icone: "Gavel",
    ordem: 1,
  },
  {
    id: "sys-pericias",
    titulo: "Perícias",
    tipo: "sistema",
    source: "pericias",
    icone: "Microscope",
    ordem: 2,
  },
  {
    id: "sys-obrigacoes",
    titulo: "Obrigações",
    tipo: "sistema",
    source: "obrigacoes",
    icone: "CircleDollarSign",
    ordem: 3,
  },
];

// =============================================================================
// QUADROS DE SISTEMA - DEFINIÇÕES COM COLUNAS ESPECÍFICAS
// =============================================================================

export type SystemBoardSource = QuadroSource;

/** Coluna de um quadro de sistema */
export interface SystemBoardColumn {
  id: string;
  label: string;
  /** statusOrigem values do UnifiedEventItem que mapeiam para esta coluna */
  matchStatuses: string[];
  /** Status enviado ao atualizarStatusEntidadeOrigem. null = coluna somente leitura (não aceita drops) */
  targetStatus: string | null;
}

/** Definição completa de um quadro de sistema */
export interface SystemBoardDefinition {
  id: string;
  slug: string;
  titulo: string;
  source: SystemBoardSource;
  icone: string;
  columns: SystemBoardColumn[];
  dndEnabled: boolean;
}

export const SYSTEM_BOARD_DEFINITIONS: SystemBoardDefinition[] = [
  {
    id: "sys-expedientes",
    slug: "expedientes",
    titulo: "Expedientes",
    source: "expedientes",
    icone: "FileText",
    dndEnabled: true,
    columns: [
      { id: "pendentes", label: "Pendentes", matchStatuses: ["pendente"], targetStatus: null },
      { id: "prazo-vencido", label: "Prazo Vencido", matchStatuses: ["vencido"], targetStatus: null },
      { id: "baixados", label: "Baixados", matchStatuses: ["baixado"], targetStatus: "done" },
    ],
  },
  {
    id: "sys-audiencias",
    slug: "audiencias",
    titulo: "Audiências",
    source: "audiencias",
    icone: "Gavel",
    dndEnabled: true,
    columns: [
      { id: "marcadas", label: "Marcadas", matchStatuses: ["M"], targetStatus: "todo" },
      { id: "realizadas", label: "Realizadas", matchStatuses: ["F"], targetStatus: "done" },
      { id: "canceladas", label: "Canceladas", matchStatuses: ["C"], targetStatus: "canceled" },
    ],
  },
  {
    id: "sys-pericias",
    slug: "pericias",
    titulo: "Perícias",
    source: "pericias",
    icone: "Microscope",
    dndEnabled: true,
    columns: [
      { id: "ativas", label: "Ativas", matchStatuses: ["S", "L", "P", "R"], targetStatus: null },
      { id: "finalizadas", label: "Finalizadas", matchStatuses: ["F"], targetStatus: "done" },
      { id: "canceladas", label: "Canceladas", matchStatuses: ["C"], targetStatus: "canceled" },
    ],
  },
  {
    id: "sys-obrigacoes",
    slug: "obrigacoes",
    titulo: "Obrigações",
    source: "obrigacoes",
    icone: "CircleDollarSign",
    dndEnabled: false,
    columns: [
      { id: "pendentes", label: "Pendentes", matchStatuses: ["pendente"], targetStatus: null },
      { id: "atrasadas", label: "Atrasadas", matchStatuses: ["atrasada", "atrasado", "vencida"], targetStatus: null },
      { id: "pagas", label: "Pagas", matchStatuses: ["pago_total", "recebida", "paga"], targetStatus: null },
    ],
  },
];

export function getSystemBoardBySlug(slug: string): SystemBoardDefinition | undefined {
  return SYSTEM_BOARD_DEFINITIONS.find((b) => b.slug === slug);
}

/** Input para DnD bidirecional em quadro de sistema */
export const systemBoardDndSchema = z.object({
  source: quadroSourceSchema,
  entityId: z.string().min(1),
  targetColumnId: z.string().min(1),
});
export type SystemBoardDndInput = z.infer<typeof systemBoardDndSchema>;

export const criarQuadroCustomSchema = z.object({
  titulo: z.string().min(1).max(100),
  icone: z.string().optional(),
});
export type CriarQuadroCustomInput = z.infer<typeof criarQuadroCustomSchema>;

export const excluirQuadroCustomSchema = z.object({
  quadroId: z.string().uuid(),
});
export type ExcluirQuadroCustomInput = z.infer<typeof excluirQuadroCustomSchema>;

export const reordenarTarefasSchema = z.object({
  tarefaId: z.string().min(1),
  novoStatus: taskStatusSchema.optional(),
  novaPosicao: z.number().int().min(0),
  quadroId: z.string().uuid().optional().nullable(),
});
export type ReordenarTarefasInput = z.infer<typeof reordenarTarefasSchema>;
