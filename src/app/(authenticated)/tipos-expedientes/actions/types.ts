/**
 * Tipos Expedientes Actions — Tipos compartilhados (sem "use server").
 */

export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};
