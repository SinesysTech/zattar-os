// Constantes relacionadas a audiências

/**
 * Opções de status de audiências
 * Ordem baseada na API do PJE TRT
 */
export const STATUS_AUDIENCIA_OPTIONS = [
  { value: 'C', label: 'Cancelada' },
  { value: 'M', label: 'Designada' },
  { value: 'F', label: 'Realizada' },
] as const;

/**
 * Mapeamento de código para descrição de status
 * Baseado na API do PJE TRT:
 * - C = Cancelada
 * - M = Designada
 * - F = Realizada
 */
export const STATUS_AUDIENCIA_MAP: Record<string, string> = {
  M: 'Designada',
  F: 'Realizada',
  C: 'Cancelada',
};

/**
 * Função para obter descrição do status
 */
export function getStatusDescricao(codigo: string | null): string {
  if (!codigo) return '-';
  return STATUS_AUDIENCIA_MAP[codigo] || codigo;
}
