/**
 * Helper para conversão de presets de vencimento em ranges de data
 * Elimina duplicação entre Contas a Pagar e Contas a Receber
 */

export interface VencimentoRange {
  dataVencimentoInicio?: string;
  dataVencimentoFim?: string;
}

export type VencimentoPreset = 'vencidas' | 'hoje' | '7dias' | '30dias' | '';

/**
 * Converte um preset de vencimento para um range de datas
 * @param preset - Preset de vencimento
 * @returns Range de datas no formato ISO (YYYY-MM-DD)
 */
export function parseVencimentoFilter(preset: VencimentoPreset): VencimentoRange {
  if (!preset) return {};

  const hoje = new Date();
  const hojeStr = hoje.toISOString().split('T')[0];

  switch (preset) {
    case 'vencidas': {
      const ontem = new Date(hoje);
      ontem.setDate(ontem.getDate() - 1);
      return { dataVencimentoFim: ontem.toISOString().split('T')[0] };
    }
    case 'hoje':
      return { dataVencimentoInicio: hojeStr, dataVencimentoFim: hojeStr };
    case '7dias': {
      const em7dias = new Date(hoje);
      em7dias.setDate(em7dias.getDate() + 7);
      return { dataVencimentoInicio: hojeStr, dataVencimentoFim: em7dias.toISOString().split('T')[0] };
    }
    case '30dias': {
      const em30dias = new Date(hoje);
      em30dias.setDate(em30dias.getDate() + 30);
      return { dataVencimentoInicio: hojeStr, dataVencimentoFim: em30dias.toISOString().split('T')[0] };
    }
    default:
      return {};
  }
}
