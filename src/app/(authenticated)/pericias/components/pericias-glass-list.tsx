'use client';

/**
 * PericiasGlassList — View de lista em cards glass (padrão expedientes/audiencias).
 * ============================================================================
 * Cada perícia é renderizada como um botão com `GlassPanel depth={2}` em grid
 * de colunas fixas (Processo / Prazo / Tribunal / Perito / Especialidade /
 * Responsável / Restante). Urgency dot + border-left colorido baseado em
 * dias até o prazo de entrega.
 * ============================================================================
 */

import * as React from 'react';
import { differenceInCalendarDays, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Sparkles, User, UserMinus } from 'lucide-react';

import { cn } from '@/lib/utils';
import { GlassPanel } from '@/components/shared/glass-panel';
import { AppBadge } from '@/components/ui/app-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getSemanticBadgeVariant } from '@/lib/design-system';

import {
  SituacaoPericiaCodigo,
  SITUACAO_PERICIA_LABELS,
  type Pericia,
} from '../domain';

// =============================================================================
// URGÊNCIA (local — não importa de expedientes)
// =============================================================================

type UrgencyLevel = 'critico' | 'alto' | 'medio' | 'baixo' | 'ok';

function getPericiaUrgency(p: Pericia): UrgencyLevel {
  if (
    p.situacaoCodigo === SituacaoPericiaCodigo.FINALIZADA ||
    p.situacaoCodigo === SituacaoPericiaCodigo.CANCELADA
  ) {
    return 'ok';
  }
  if (!p.prazoEntrega) return 'ok';
  try {
    const diff = differenceInCalendarDays(parseISO(p.prazoEntrega), new Date());
    if (diff < 0) return 'critico';
    if (diff === 0) return 'alto';
    if (diff <= 7) return 'medio';
    return 'baixo';
  } catch {
    return 'ok';
  }
}

function getDiasRestantes(p: Pericia): number | null {
  if (!p.prazoEntrega) return null;
  try {
    return differenceInCalendarDays(parseISO(p.prazoEntrega), new Date());
  } catch {
    return null;
  }
}

const URGENCY_BORDER: Record<UrgencyLevel, string> = {
  critico: 'border-l-[3px] border-l-destructive',
  alto: 'border-l-[3px] border-l-warning',
  medio: 'border-l-[3px] border-l-info',
  baixo: 'border-l-[3px] border-l-success',
  ok: 'border-l-[3px] border-l-border/20',
};

const URGENCY_DOT: Record<UrgencyLevel, string> = {
  critico: 'bg-destructive shadow-[0_0_6px_var(--destructive)]',
  alto: 'bg-warning shadow-[0_0_4px_var(--warning)]',
  medio: 'bg-info',
  baixo: 'bg-success',
  ok: 'bg-muted-foreground/40',
};

const URGENCY_COUNTDOWN: Record<UrgencyLevel, string> = {
  critico: 'bg-destructive/8 text-destructive',
  alto: 'bg-warning/8 text-warning',
  medio: 'bg-info/8 text-info',
  baixo: 'bg-success/6 text-success',
  ok: 'bg-muted text-muted-foreground/50',
};

function CountdownBadge({
  dias,
  urgency,
}: {
  dias: number | null;
  urgency: UrgencyLevel;
}) {
  if (dias === null) {
    return (
      <span className="text-[11px] text-muted-foreground/40 tabular-nums">
        —
      </span>
    );
  }
  const label =
    dias < 0 ? `${Math.abs(dias)}d⇓` : dias === 0 ? 'hoje' : `${dias}d`;
  return (
    <span
      className={cn(
        'text-[11px] font-semibold tabular-nums px-2 py-1 rounded-lg text-center',
        URGENCY_COUNTDOWN[urgency],
      )}
    >
      {label}
    </span>
  );
}

// =============================================================================
// COLUMN HEADERS
// =============================================================================

const GRID_COLS =
  'grid-cols-[32px_2.2fr_1fr_1fr_1fr_1fr_80px_40px]';

function ColumnHeaders() {
  return (
    <div
      className={cn(
        'grid gap-3 items-center px-4 py-2.5 mb-3 rounded-lg bg-muted/30 border border-border/30',
        GRID_COLS,
      )}
    >
      <div />
      <span className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider">
        Processo / Partes
      </span>
      <span className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider">
        Prazo
      </span>
      <span className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider">
        Especialidade
      </span>
      <span className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider">
        Perito
      </span>
      <span className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider">
        Responsável
      </span>
      <span className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider text-center">
        Restante
      </span>
      <div />
    </div>
  );
}

// =============================================================================
// GLASS ROW
// =============================================================================

interface GlassRowProps {
  pericia: Pericia;
  onViewDetail: () => void;
}

function GlassRow({ pericia, onViewDetail }: GlassRowProps) {
  const urgency = getPericiaUrgency(pericia);
  const dias = getDiasRestantes(pericia);
  const responsavel = pericia.responsavel?.nomeExibicao;
  const especialidade = pericia.especialidade?.descricao;
  const perito = pericia.perito?.nome;
  const parteAutora = pericia.processo?.nomeParteAutora;
  const parteRe = pericia.processo?.nomeParteRe;

  const prazoFormatted = pericia.prazoEntrega
    ? format(parseISO(pericia.prazoEntrega), 'dd/MM/yy', { locale: ptBR })
    : null;

  return (
    <button
      type="button"
      onClick={onViewDetail}
      className={cn(
        'group w-full text-left rounded-2xl border border-border/40 p-4 cursor-pointer bg-card',
        'transition-all duration-180 ease-out',
        'hover:bg-accent/40 hover:border-border/60 hover:scale-[1.003] hover:-translate-y-px hover:shadow-lg',
        URGENCY_BORDER[urgency],
      )}
    >
      <div className={cn('grid gap-3 items-center', GRID_COLS)}>
        {/* 1. Urgency dot */}
        <div className="flex items-center justify-center">
          <div
            className={cn('w-2 h-2 rounded-full shrink-0', URGENCY_DOT[urgency])}
          />
        </div>

        {/* 2. Processo + partes */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium tabular-nums truncate">
              {pericia.numeroProcesso}
            </span>
            <AppBadge
              variant={getSemanticBadgeVariant(
                'pericia_situacao',
                pericia.situacaoCodigo,
              )}
              className="shrink-0 text-[9px] px-1.5 py-0.5 font-semibold uppercase tracking-wider"
            >
              {SITUACAO_PERICIA_LABELS[pericia.situacaoCodigo]}
            </AppBadge>
            {urgency === 'critico' && (
              <span className="inline-flex items-center bg-destructive/10 border border-destructive/20 text-destructive rounded px-1.5 py-0.5 text-[9px] font-semibold shrink-0 uppercase tracking-wider">
                Vencido
              </span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground/70 truncate mt-1">
            <span className="inline-block max-w-55 truncate align-bottom">
              {parteAutora || 'Autor não informado'}
            </span>
            <span className="text-muted-foreground/40 mx-1">vs</span>
            <span className="inline-block max-w-55 truncate align-bottom">
              {parteRe || 'Réu não informado'}
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mt-0.5">
            {pericia.trt} · {pericia.grau === 'primeiro_grau' ? '1º Grau' : '2º Grau'}
          </div>
        </div>

        {/* 3. Prazo */}
        <div className="min-w-0">
          <span className="text-xs font-medium tabular-nums text-foreground/90">
            {prazoFormatted ?? '—'}
          </span>
        </div>

        {/* 4. Especialidade */}
        <div className="min-w-0">
          <span className="text-xs text-foreground/80 truncate block">
            {especialidade || (
              <span className="text-muted-foreground/40 italic">—</span>
            )}
          </span>
        </div>

        {/* 5. Perito */}
        <div className="min-w-0">
          <span className="text-xs text-foreground/80 truncate block">
            {perito || (
              <span className="text-muted-foreground/40 italic">A definir</span>
            )}
          </span>
        </div>

        {/* 6. Responsável */}
        <div className="min-w-0 flex items-center gap-1.5">
          {responsavel ? (
            <>
              <User className="size-3 shrink-0 text-muted-foreground/50" />
              <span className="text-xs text-foreground/80 truncate">
                {responsavel}
              </span>
            </>
          ) : (
            <>
              <UserMinus className="size-3 shrink-0 text-warning/60" />
              <span className="text-[11px] text-warning/70">Sem atribuir</span>
            </>
          )}
        </div>

        {/* 7. Countdown */}
        <div className="flex justify-center">
          <CountdownBadge dias={dias} urgency={urgency} />
        </div>

        {/* 8. Chevron indicator on hover */}
        <div className="flex items-center justify-center">
          <span
            aria-hidden="true"
            className="text-muted-foreground/30 group-hover:text-primary/80 transition-colors"
          >
            ›
          </span>
        </div>
      </div>
    </button>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export interface PericiasGlassListProps {
  pericias: Pericia[];
  isLoading: boolean;
  onViewDetail: (pericia: Pericia) => void;
  emptyMessage?: string;
}

export function PericiasGlassList({
  pericias,
  isLoading,
  onViewDetail,
  emptyMessage = 'Nenhuma perícia encontrada.',
}: PericiasGlassListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (pericias.length === 0) {
    return (
      <GlassPanel
        depth={1}
        className="p-12 flex flex-col items-center justify-center text-center"
      >
        <Sparkles className="size-10 text-primary/30 mb-3" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </GlassPanel>
    );
  }

  return (
    <div>
      <ColumnHeaders />
      <div className="space-y-1.5">
        {pericias.map((pericia) => (
          <GlassRow
            key={pericia.id}
            pericia={pericia}
            onViewDetail={() => onViewDetail(pericia)}
          />
        ))}
      </div>
    </div>
  );
}
