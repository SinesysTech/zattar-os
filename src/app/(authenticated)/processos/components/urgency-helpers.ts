import { differenceInDays, parseISO } from 'date-fns';

export type ProcessoUrgencyLevel = 'critico' | 'alto' | 'medio' | 'baixo' | 'ok';

export const PROCESS_URGENCY_BORDER: Record<ProcessoUrgencyLevel, string> = {
  critico: 'border-l-[3px] border-l-destructive',
  alto: 'border-l-[3px] border-l-warning',
  medio: 'border-l-[3px] border-l-info',
  baixo: 'border-l-[3px] border-l-success',
  ok: '',
};

export const PROCESS_URGENCY_ALERT_COLOR: Record<ProcessoUrgencyLevel, string> = {
  critico: 'text-destructive',
  alto: 'text-warning',
  medio: 'text-info',
  baixo: 'text-success/70',
  ok: 'text-muted-foreground/40',
};

export const PROCESS_URGENCY_VALUE_CLASS: Record<ProcessoUrgencyLevel, string> = {
  critico: 'text-destructive font-medium',
  alto: 'text-warning font-medium',
  medio: 'text-info font-medium',
  baixo: 'text-muted-foreground/70',
  ok: 'text-muted-foreground/60',
};

/** Urgência baseada em proximidade da próxima audiência. */
export function getProcessoUrgency(
  dataProximaAudiencia?: string | null,
): ProcessoUrgencyLevel {
  if (!dataProximaAudiencia) return 'ok';
  const dias = differenceInDays(parseISO(dataProximaAudiencia), new Date());
  if (dias < 0) return 'critico';
  if (dias <= 3) return 'alto';
  if (dias <= 10) return 'medio';
  if (dias <= 20) return 'baixo';
  return 'ok';
}
