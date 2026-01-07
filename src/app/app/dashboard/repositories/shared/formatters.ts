/**
 * DASHBOARD FEATURE - Shared Formatters
 *
 * Funções de formatação compartilhadas entre repositories.
 */

/**
 * Formata valor monetário em formato BRL
 */
export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}
