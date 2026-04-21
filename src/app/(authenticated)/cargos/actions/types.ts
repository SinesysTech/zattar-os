/**
 * Cargos Actions — Tipos compartilhados (sem "use server").
 */

export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  errorDetail?: unknown; // For structured errors like CargoComUsuariosError
};
