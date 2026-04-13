import { differenceInDays, parseISO } from 'date-fns';
import type { Expediente, UrgencyLevel } from '../domain';
import { getExpedienteUrgencyLevel } from '../domain';

export type { UrgencyLevel } from '../domain';

/** @deprecated Use `getExpedienteUrgencyLevel` from `../domain` directly. */
export function getExpedienteUrgency(exp: Expediente): ReturnType<typeof getExpedienteUrgencyLevel> {
  return getExpedienteUrgencyLevel(exp);
}

export function getExpedienteDiasRestantes(exp: Expediente): number | null {
  const prazo = exp.dataPrazoLegalParte;
  if (!prazo) return null;
  return differenceInDays(parseISO(prazo), new Date());
}

export const URGENCY_BORDER: Record<UrgencyLevel, string> = {
  critico: 'border-l-[3px] border-l-destructive',
  alto: 'border-l-[3px] border-l-warning',
  medio: 'border-l-[3px] border-l-info',
  baixo: 'border-l-[3px] border-l-success',
  ok: 'border-l-[3px] border-l-border/20',
};

export const URGENCY_DOT: Record<UrgencyLevel, string> = {
  critico: 'bg-destructive shadow-[0_0_6px_var(--destructive)]',
  alto: 'bg-warning shadow-[0_0_4px_var(--warning)]',
  medio: 'bg-info',
  baixo: 'bg-success',
  ok: 'bg-muted-foreground/40',
};

export const URGENCY_COUNTDOWN: Record<UrgencyLevel, string> = {
  critico: 'bg-destructive/8 text-destructive',
  alto: 'bg-warning/8 text-warning',
  medio: 'bg-info/8 text-info',
  baixo: 'bg-success/6 text-success',
  ok: 'bg-muted text-muted-foreground/50',
};

export const URGENCY_SECTIONS = [
  { key: 'critico' as const, label: 'Vencidos', color: 'bg-destructive' },
  { key: 'alto' as const, label: 'Vence Hoje', color: 'bg-warning' },
  { key: 'medio' as const, label: 'Proximos Dias', color: 'bg-info' },
  { key: 'baixo' as const, label: 'No Prazo', color: 'bg-success' },
  { key: 'ok' as const, label: 'Outros', color: 'bg-muted-foreground/40' },
] as const;
