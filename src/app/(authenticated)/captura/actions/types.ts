/**
 * Captura Actions — Tipos compartilhados (sem "use server").
 */

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
