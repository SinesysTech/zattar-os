/**
 * Advogados Actions — Tipos compartilhados
 *
 * Arquivo SEM "use server": hospeda tipos que antes viviam em advogados-actions.ts.
 * Next.js 16 proíbe exports não-async-function em arquivos "use server".
 */

export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};
