/**
 * Entrevistas Trabalhistas Actions — Tipos compartilhados (sem "use server").
 */

export interface IntegracaoPeticaoResult {
  success: boolean;
  message: string;
  workflowRunId?: string;
  payload?: Record<string, unknown>;
}

export interface ConsolidacaoIAResult {
  success: boolean;
  relatoConsolidado?: string;
  inconsistencias?: string[];
  error?: string;
}

export type EntrevistaActionResult<T = unknown> =
  | { success: true; data: T; message: string }
  | { success: false; error: string; message: string };
