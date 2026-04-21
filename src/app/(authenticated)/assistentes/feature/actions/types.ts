/**
 * Assistentes Feature Actions — Tipos compartilhados (sem "use server").
 */

export interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
