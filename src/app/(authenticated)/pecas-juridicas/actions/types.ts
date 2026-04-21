/**
 * Peças Jurídicas Actions — Tipos compartilhados (sem "use server").
 */

export type ActionResult<T = unknown> =
  | { success: true; data: T; message: string }
  | { success: false; error: string; errors?: Record<string, string[]>; message: string };
