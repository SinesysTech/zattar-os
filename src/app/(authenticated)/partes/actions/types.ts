/**
 * Partes Actions — Tipos compartilhados
 *
 * Arquivo SEM "use server": hospeda tipos/interfaces que antes viviam dentro
 * de arquivos de Server Actions. Next.js 16 proíbe exports não-async-function
 * em arquivos "use server" (falha em runtime ao carregar o módulo).
 */

// =============================================================================
// RESULTADOS DE SERVER ACTIONS
// =============================================================================

/**
 * Formato padrão de retorno das Server Actions do módulo Partes.
 * `errors` é opcional para compatibilidade com actions que não reportam
 * erros de validação por campo (ex: processo-partes-actions).
 */
export type ActionResult<T = unknown> =
  | { success: true; data: T; message: string }
  | { success: false; error: string; errors?: Record<string, string[]>; message: string };

// =============================================================================
// ESTATÍSTICAS (partes-stats-actions)
// =============================================================================

export interface PartesTipoCounts {
  total: number;
  novosMes: number;
}

export interface ContarPartesPorTipoData {
  clientes: PartesTipoCounts;
  partesContrarias: PartesTipoCounts;
  terceiros: PartesTipoCounts;
  representantes: PartesTipoCounts;
}
