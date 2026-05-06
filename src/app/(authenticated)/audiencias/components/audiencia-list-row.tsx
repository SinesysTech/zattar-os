/**
 * AudienciaListRow — Linha de lista no padrão ContratoListRow
 * ============================================================================
 * Exibe uma audiência em formato compacto horizontal com:
 * status dot, ícone, info principal, data/hora, modalidade, TRT, prep ring,
 * countdown/status e chevron.
 * ============================================================================
 */

'use client';

import { useMemo } from 'react';
import {
  Gavel,
  Video,
  Building2,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { IconContainer } from '@/components/ui/icon-container';
import { Text } from '@/components/ui/typography';
import type { Audiencia } from '../domain';
import { StatusAudiencia, GRAU_TRIBUNAL_LABELS } from '../domain';
import { calcPrepItems, calcPrepScore } from './prep-score';

// ─── Types ────────────────────────────────────────────────────────────────

export interface AudienciaListRowProps {
  audiencia: Audiencia;
  onClick?: (audiencia: Audiencia) => void;
  selected?: boolean;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

const MODALIDADE_ICON = {
  virtual: Video,
  presencial: Building2,
  hibrida: Sparkles,
} as const;

const MODALIDADE_LABEL = {
  virtual: 'Virtual',
  presencial: 'Presencial',
  hibrida: 'Híbrida',
} as const;

function fmtTime(iso: string): string {
  try {
    return parseISO(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

function getTimeUntil(iso: string): { label: string; totalMs: number } {
  try {
    const diff = parseISO(iso).getTime() - Date.now();
    if (diff <= 0) return { label: 'Passada', totalMs: 0 };
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    if (hours > 0) return { label: `${hours}h ${minutes}min`, totalMs: diff };
    return { label: `${minutes}min`, totalMs: diff };
  } catch {
    return { label: '—', totalMs: 0 };
  }
}

function getPrepStatus(score: number): 'good' | 'warning' | 'danger' {
  if (score >= 80) return 'good';
  if (score >= 50) return 'warning';
  return 'danger';
}

const PREP_COLORS: Record<string, string> = {
  good: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--destructive)',
};

// ─── Component ────────────────────────────────────────────────────────────

export function AudienciaListRow({ audiencia, onClick, selected, className }: AudienciaListRowProps) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const now = new Date();
  const isPast = useMemo(() => {
    try { return parseISO(audiencia.dataFim) < now; } catch { return false; }
  }, [audiencia.dataFim, now]);

  const isFinalizada = audiencia.status === StatusAudiencia.Finalizada;
  const isCancelada = audiencia.status === StatusAudiencia.Cancelada;
  const prepScore = useMemo(() => calcPrepScore(calcPrepItems(audiencia)), [audiencia]);
  const prepStatus = getPrepStatus(prepScore);
  const ModalIcon = MODALIDADE_ICON[audiencia.modalidade as keyof typeof MODALIDADE_ICON] ?? Gavel;
  const modalidadeLabel = MODALIDADE_LABEL[audiencia.modalidade as keyof typeof MODALIDADE_LABEL] ?? '—';
  const timeUntil = useMemo(() => getTimeUntil(audiencia.dataInicio), [audiencia.dataInicio]);

  const statusDotColor = isFinalizada
    ? 'bg-success/50'
    : isCancelada
    ? 'bg-destructive/50'
    : isPast
    ? 'bg-muted-foreground/45'
    : 'bg-primary/50';

  // Prep ring (inline SVG)
  const ringSize = 28;
  const strokeWidth = ringSize * 0.12;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (prepScore / 100) * circumference;

  return (
    <button
      onClick={() => onClick?.(audiencia)}
      className={cn(
        /* design-system-escape: px-4 padding direcional sem Inset equiv.; py-2.5 padding direcional sem Inset equiv. */ 'w-full flex items-center inline-medium px-4 py-2.5 rounded-xl cursor-pointer transition-all outline-none text-left',
        'focus-visible:ring-1 focus-visible:ring-primary/55 hover:bg-foreground/4',
        selected && 'bg-primary/6',
        (isPast || isFinalizada || isCancelada) && 'opacity-55',
        className,
      )}
    >
      {/* Status dot */}
      <div className={cn('size-2.5 rounded-full shrink-0', statusDotColor)} />

      {/* Icon */}
      <IconContainer size="md" className="bg-primary/8">
        <Gavel className="size-3.5 text-primary/70" />
      </IconContainer>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <Text variant="caption" as="p" className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium truncate text-foreground/80")}>{audiencia.tipoDescricao || 'Audiência'}</Text>
        <p className="text-micro-caption text-muted-foreground/65 truncate">
          {audiencia.poloAtivoNome || '—'} vs {audiencia.poloPassivoNome || '—'}
        </p>
        {audiencia.orgaoJulgadorOrigem && (
          <p className="text-micro-caption text-muted-foreground/65 truncate">{audiencia.orgaoJulgadorOrigem}</p>
        )}
        {audiencia.observacoes && (
          <p className="text-micro-caption text-muted-foreground/65 truncate italic" title={audiencia.observacoes}>{audiencia.observacoes}</p>
        )}
      </div>

      {/* Date/Time */}
      <div className="text-right shrink-0 hidden sm:block">
        <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-micro-caption font-medium tabular-nums")}>
          {(() => {
            try {
              return parseISO(audiencia.dataInicio).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
            } catch {
              return '—';
            }
          })()}
        </p>
        <p className="text-micro-caption text-muted-foreground/70 tabular-nums">
          {fmtTime(audiencia.dataInicio)}
        </p>
      </div>

      {/* Modalidade */}
      <div className={cn("flex items-center inline-micro shrink-0 md:flex w-20")}>
        <ModalIcon className="size-2.5 text-muted-foreground/65" />
        <span className="text-micro-caption text-muted-foreground/75">{modalidadeLabel}</span>
      </div>

      {/* TRT + Grau */}
      {audiencia.trt && (
        <div className={cn("flex items-center inline-micro shrink-0 md:flex")}>
          <span className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading>; px-1.5 padding direcional sem Inset equiv. */ "text-micro-caption font-semibold px-1.5 py-px rounded bg-primary/5 text-primary/65")}>
            {audiencia.trt}
          </span>
          {audiencia.grau && (
            <span className="text-micro-caption text-muted-foreground/65">{GRAU_TRIBUNAL_LABELS[audiencia.grau]}</span>
          )}
        </div>
      )}

      {/* Prep ring */}
      <div className="shrink-0 w-10 flex justify-center">
        <div className="relative" style={{ width: ringSize, height: ringSize }}>
          <svg width={ringSize} height={ringSize} className="-rotate-90">
            <circle cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-border/15" />
            <circle
              cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none"
              stroke={PREP_COLORS[prepStatus]}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn(
              /* design-system-escape: font-bold → className de <Text>/<Heading> */ 'font-bold tabular-nums text-micro-badge',
              prepStatus === 'good' ? 'text-success' : prepStatus === 'warning' ? 'text-warning' : 'text-destructive',
            )}>
              {prepScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Countdown or status */}
      <span className={cn(
        /* design-system-escape: font-medium → className de <Text>/<Heading> */ 'text-micro-caption shrink-0 w-16 text-right tabular-nums font-medium',
        isFinalizada ? 'text-success/70' :
        isCancelada ? 'text-destructive/70' :
        !isPast ? (timeUntil.totalMs <= 60 * 60 * 1000 ? 'text-warning/75' : 'text-muted-foreground/65') :
        'text-muted-foreground/55',
      )}>
        {isFinalizada ? 'Realizada' : isCancelada ? 'Cancelada' : !isPast ? timeUntil.label : 'Passada'}
      </span>

      <ChevronRight className="size-3.5 text-muted-foreground/65 shrink-0" />
    </button>
  );
}
