/**
 * EVENT AGGREGATION DOMAIN
 *
 * Tipos e constantes compartilhados para agregação de eventos do sistema
 * (audiências, expedientes, perícias, obrigações) em Tarefas e To-Do.
 */

import { z } from "zod";

// =============================================================================
// TYPES
// =============================================================================

export const eventSourceSchema = z.enum([
  "audiencias",
  "expedientes",
  "pericias",
  "obrigacoes",
]);
export type EventSource = z.infer<typeof eventSourceSchema>;

export interface UnifiedEventItem {
  id: string; // "source:entityId"
  source: EventSource;
  sourceEntityId: number | string;
  titulo: string;
  descricao?: string;
  dataVencimento?: string; // ISO string
  prazoVencido?: boolean;
  responsavelId: number | null;
  responsavelNome?: string;
  statusOrigem: string; // status original da entidade
  url: string; // deep link para a entidade de origem
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const SOURCE_LABELS: Record<EventSource, string> = {
  audiencias: "Audiência",
  expedientes: "Expediente",
  pericias: "Perícia",
  obrigacoes: "Obrigação",
};

export const SOURCE_BADGE_VARIANTS: Record<EventSource, string> = {
  audiencias: "info",
  expedientes: "warning",
  pericias: "secondary",
  obrigacoes: "default",
};

// =============================================================================
// STATUS MAPPING: Source → Tarefas (backlog/todo/in progress/done/canceled)
// =============================================================================

export type TarefaStatus = "backlog" | "todo" | "in progress" | "done" | "canceled";

export function mapSourceStatusToTarefaStatus(source: EventSource, statusOrigem: string): TarefaStatus {
  switch (source) {
    case "audiencias":
      if (statusOrigem === "F") return "done";
      if (statusOrigem === "C") return "canceled";
      return "todo"; // M (Marcada)
    case "expedientes":
      if (statusOrigem === "baixado") return "done";
      return "todo"; // pendente, vencido
    case "pericias":
      if (statusOrigem === "F") return "done";
      if (statusOrigem === "C") return "canceled";
      return "in progress"; // S, L, P, R (ativas)
    case "obrigacoes":
      if (statusOrigem === "pago_total" || statusOrigem === "recebida" || statusOrigem === "paga") return "done";
      return "todo"; // pendente, atrasado
    default:
      return "todo";
  }
}

// =============================================================================
// STATUS MAPPING: Source → To-Do (pending/in-progress/completed)
// =============================================================================

export type TodoStatusValue = "pending" | "in-progress" | "completed";

export function mapSourceStatusToTodoStatus(source: EventSource, statusOrigem: string): TodoStatusValue {
  switch (source) {
    case "audiencias":
      if (statusOrigem === "F" || statusOrigem === "C") return "completed";
      return "pending"; // M (Marcada)
    case "expedientes":
      if (statusOrigem === "baixado") return "completed";
      return "pending"; // pendente, vencido
    case "pericias":
      if (statusOrigem === "F" || statusOrigem === "C") return "completed";
      return "in-progress"; // S, L, P, R (ativas)
    case "obrigacoes":
      if (statusOrigem === "pago_total" || statusOrigem === "recebida" || statusOrigem === "paga") return "completed";
      return "pending"; // pendente, atrasado
    default:
      return "pending";
  }
}

// =============================================================================
// PRIORITY MAPPING: baseado em proximidade do prazo
// =============================================================================

export type PriorityValue = "low" | "medium" | "high";

export function calcularPrioridade(dataVencimento?: string, prazoVencido?: boolean): PriorityValue {
  if (prazoVencido) return "high";
  if (!dataVencimento) return "medium";

  const agora = new Date();
  const vencimento = new Date(dataVencimento);
  const diffMs = vencimento.getTime() - agora.getTime();
  const diffHoras = diffMs / (1000 * 60 * 60);

  if (diffHoras < 0) return "high"; // já venceu
  if (diffHoras < 48) return "high"; // < 48h
  if (diffHoras < 168) return "medium"; // < 7 dias
  return "low";
}

export function buildEventId(source: EventSource, entityId: number | string): string {
  return `${source}:${entityId}`;
}
