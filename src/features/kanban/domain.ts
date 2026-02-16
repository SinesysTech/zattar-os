/**
 * KANBAN DOMAIN
 *
 * Dominio unificado para o Kanban multi-board.
 * Contém os tipos originais do template + novos tipos para boards de sistema.
 */

import { z } from "zod";

// =============================================================================
// ORIGINAL — Custom Board Types (template Kanban)
// =============================================================================

export const kanbanTaskPrioritySchema = z.enum(["low", "medium", "high"]);
export type KanbanTaskPriority = z.infer<typeof kanbanTaskPrioritySchema>;

export const kanbanTaskUserSchema = z.object({
  name: z.string().min(1),
  src: z.string().min(1),
  alt: z.string().optional(),
  fallback: z.string().optional(),
});
export type KanbanTaskUser = z.infer<typeof kanbanTaskUserSchema>;

export const kanbanTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  priority: kanbanTaskPrioritySchema,
  assignee: z.string().optional(),
  dueDate: z.string().optional(), // yyyy-mm-dd
  progress: z.number().int().min(0).max(100),
  attachments: z.number().int().min(0).optional(),
  comments: z.number().int().min(0).optional(),
  users: z.array(kanbanTaskUserSchema),
});
export type KanbanTask = z.infer<typeof kanbanTaskSchema>;

export const kanbanAssignableUserSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  email: z.string().email().optional(),
  avatarUrl: z.string().optional(),
});
export type KanbanAssignableUser = z.infer<typeof kanbanAssignableUserSchema>;

export const kanbanColumnSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  position: z.number().int().min(0),
});
export type KanbanColumn = z.infer<typeof kanbanColumnSchema>;

export const kanbanBoardSchema = z.object({
  columns: z.array(kanbanColumnSchema),
  tasksByColumn: z.record(z.string(), z.array(kanbanTaskSchema)),
});
export type KanbanBoardData = z.infer<typeof kanbanBoardSchema>;

export const createKanbanColumnSchema = z.object({
  title: z.string().min(1).max(100),
});
export type CreateKanbanColumnInput = z.infer<typeof createKanbanColumnSchema>;

export const createKanbanTaskSchema = z.object({
  columnId: z.string().min(1),
  title: z.string().min(1).max(160),
  description: z.string().max(2000).optional(),
  priority: kanbanTaskPrioritySchema.optional(),
});
export type CreateKanbanTaskInput = z.infer<typeof createKanbanTaskSchema>;

export const syncKanbanBoardSchema = z.object({
  columns: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      position: z.number().int().min(0),
    })
  ),
  tasks: z.array(
    z.object({
      id: z.string().min(1),
      columnId: z.string().min(1),
      position: z.number().int().min(0),
    })
  ),
});
export type SyncKanbanBoardInput = z.infer<typeof syncKanbanBoardSchema>;

// =============================================================================
// MULTI-BOARD — Board Definition Types
// =============================================================================

export const KANBAN_BOARD_SOURCES = ["expedientes", "audiencias", "obrigacoes"] as const;
export type KanbanBoardSource = (typeof KANBAN_BOARD_SOURCES)[number];
export type KanbanBoardType = "system" | "custom";
export type KanbanCardSource = KanbanBoardSource | "custom";

export const kanbanBoardSourceSchema = z.enum(["expedientes", "audiencias", "obrigacoes"]);

export interface KanbanBoardDef {
  id: string;
  titulo: string;
  tipo: KanbanBoardType;
  source: KanbanBoardSource | null;
  icone?: string;
  ordem: number;
}

/** System boards constantes (criados lazily no DB). */
export const SYSTEM_BOARDS: KanbanBoardDef[] = [
  {
    id: "sys-expedientes",
    titulo: "Expedientes",
    tipo: "system",
    source: "expedientes",
    icone: "FileText",
    ordem: 0,
  },
  {
    id: "sys-audiencias",
    titulo: "Audiências",
    tipo: "system",
    source: "audiencias",
    icone: "Gavel",
    ordem: 1,
  },
  {
    id: "sys-obrigacoes",
    titulo: "Obrigações",
    tipo: "system",
    source: "obrigacoes",
    icone: "CircleDollarSign",
    ordem: 2,
  },
];

// =============================================================================
// MULTI-BOARD — System Board Columns
// =============================================================================

export const SYSTEM_BOARD_COLUMNS: Record<
  KanbanBoardSource,
  Array<{ id: string; title: string; statusKey: string }>
> = {
  expedientes: [
    { id: "exp-pendente", title: "Pendentes", statusKey: "pendente" },
    { id: "exp-vencido", title: "Prazo Vencido", statusKey: "vencido" },
    { id: "exp-baixado", title: "Baixados", statusKey: "baixado" },
  ],
  audiencias: [
    { id: "aud-marcada", title: "Marcadas", statusKey: "M" },
    { id: "aud-finalizada", title: "Realizadas", statusKey: "F" },
    { id: "aud-cancelada", title: "Canceladas", statusKey: "C" },
  ],
  obrigacoes: [
    { id: "obr-pendente", title: "Pendentes", statusKey: "pendente" },
    { id: "obr-atrasada", title: "Atrasadas", statusKey: "atrasado" },
    { id: "obr-paga", title: "Pagas", statusKey: "pago_total" },
  ],
};

// =============================================================================
// MULTI-BOARD — Unified Kanban Card (padrão UnifiedCalendarEvent)
// =============================================================================

export const unifiedKanbanCardSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  descricao: z.string().optional(),
  prioridade: z.enum(["low", "medium", "high"]).optional(),
  dataVencimento: z.string().optional(),
  prazoVencido: z.boolean().optional(),
  responsavelId: z.number().nullable().optional(),
  responsavelNome: z.string().optional(),
  source: z.enum(["expedientes", "audiencias", "obrigacoes", "custom"]),
  sourceEntityId: z.union([z.string(), z.number()]).optional(),
  url: z.string().optional(),
  columnId: z.string(),
  position: z.number(),
  color: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export interface UnifiedKanbanCard {
  id: string;
  titulo: string;
  descricao?: string;
  prioridade?: "low" | "medium" | "high";
  dataVencimento?: string;
  prazoVencido?: boolean;
  responsavelId?: number | null;
  responsavelNome?: string;
  source: KanbanCardSource;
  sourceEntityId?: string | number;
  url?: string;
  columnId: string;
  position: number;
  color?: string;
  metadata?: Record<string, unknown>;
}

export interface SystemBoardData {
  columns: Array<{ id: string; title: string; statusKey: string }>;
  cardsByColumn: Record<string, UnifiedKanbanCard[]>;
}

export function buildKanbanCardId(source: KanbanCardSource, entityId: string | number): string {
  return `${source}:${entityId}`;
}

// =============================================================================
// ACTION SCHEMAS
// =============================================================================

export const criarQuadroCustomSchema = z.object({
  titulo: z.string().min(1).max(100),
});
export type CriarQuadroCustomInput = z.infer<typeof criarQuadroCustomSchema>;

export const obterQuadroSistemaSchema = z.object({
  source: kanbanBoardSourceSchema,
});
export type ObterQuadroSistemaInput = z.infer<typeof obterQuadroSistemaSchema>;

export const obterQuadroCustomSchema = z.object({
  boardId: z.string().min(1),
});
export type ObterQuadroCustomInput = z.infer<typeof obterQuadroCustomSchema>;

export const excluirQuadroCustomSchema = z.object({
  boardId: z.string().min(1),
});

export const atualizarStatusEntidadeSchema = z.object({
  source: kanbanBoardSourceSchema,
  entityId: z.union([z.string(), z.number()]),
  targetColumnId: z.string().min(1),
});
export type AtualizarStatusEntidadeInput = z.infer<typeof atualizarStatusEntidadeSchema>;
