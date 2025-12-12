/**
 * Helpers legados para telas de Terceiros.
 *
 * Alguns módulos ainda importam `@/types/terceiros` para obter labels.
 * Mantemos aqui para compatibilidade.
 */

export type PoloTerceiro = 'ATIVO' | 'PASSIVO' | 'NEUTRO' | 'TERCEIRO';

export type TipoParteTerceiro =
  | 'PERITO'
  | 'MINISTERIO_PUBLICO'
  | 'ASSISTENTE'
  | 'TESTEMUNHA'
  | 'CUSTOS_LEGIS'
  | 'AMICUS_CURIAE'
  | 'OUTRO';

export function getPoloLabel(polo: PoloTerceiro | null | undefined): string {
  switch (polo) {
    case 'ATIVO':
      return 'Ativo';
    case 'PASSIVO':
      return 'Passivo';
    case 'NEUTRO':
      return 'Neutro';
    case 'TERCEIRO':
      return 'Terceiro';
    default:
      return '—';
  }
}

export function getTipoParteLabel(tipo: TipoParteTerceiro | string | null | undefined): string {
  switch (tipo) {
    case 'PERITO':
      return 'Perito';
    case 'MINISTERIO_PUBLICO':
      return 'Ministério Público';
    case 'ASSISTENTE':
      return 'Assistente';
    case 'TESTEMUNHA':
      return 'Testemunha';
    case 'CUSTOS_LEGIS':
      return 'Custos legis';
    case 'AMICUS_CURIAE':
      return 'Amicus curiae';
    case 'OUTRO':
      return 'Outro';
    default:
      return '—';
  }
}


