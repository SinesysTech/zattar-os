'use client';

import * as React from 'react';
import { parseISO, format, differenceInCalendarDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  FileSearch,
  Wallet,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Skeleton } from '@/components/ui/skeleton';

import type { AcordoComParcelas } from '../../domain';
import { STATUS_LABELS, TIPO_LABELS, DIRECAO_LABELS } from '../../domain';

// =============================================================================
// TYPES & HELPERS
// =============================================================================

type Urgency = 'critico' | 'alto' | 'medio' | 'baixo' | 'ok';

interface ObrigacoesGlassListProps {
  acordos: AcordoComParcelas[];
  isLoading: boolean;
  onViewDetail: (acordo: AcordoComParcelas) => void;
}

const CURRENCY = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

const URGENCY_BORDER: Record<Urgency, string> = {
  critico: 'border-l-destructive/40',
  alto: 'border-l-warning/40',
  medio: 'border-l-primary/30',
  baixo: 'border-l-muted/20',
  ok: 'border-l-success/25',
};

const URGENCY_DOT: Record<Urgency, string> = {
  critico: 'bg-destructive',
  alto: 'bg-warning',
  medio: 'bg-primary',
  baixo: 'bg-muted-foreground/40',
  ok: 'bg-success',
};

function getUrgency(acordo: AcordoComParcelas): Urgency {
  if (acordo.status === 'pago_total') return 'ok';
  if (acordo.status === 'atrasado') return 'critico';
  if (!acordo.proximoVencimento) return 'baixo';

  try {
    const dias = differenceInCalendarDays(parseISO(acordo.proximoVencimento), new Date());
    if (dias < 0) return 'critico';
    if (dias === 0) return 'alto';
    if (dias <= 7) return 'medio';
    return 'baixo';
  } catch {
    return 'baixo';
  }
}

function getDiasRestantes(acordo: AcordoComParcelas): number | null {
  if (!acordo.proximoVencimento) return null;
  try {
    return differenceInCalendarDays(parseISO(acordo.proximoVencimento), new Date());
  } catch {
    return null;
  }
}

// =============================================================================
// COLUMN HEADERS
// =============================================================================

function ColumnHeaders() {
  return (
    <div className="grid grid-cols-[32px_2.5fr_1fr_1fr_1fr_96px_40px] gap-3 items-center px-4 mb-2">
      <div />
      <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
        Processo / Tipo
      </span>
      <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
        Próximo venc.
      </span>
      <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
        Valor total
      </span>
      <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
        Parcelas
      </span>
      <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider text-center">
        Status
      </span>
      <div />
    </div>
  );
}

// =============================================================================
// GLASS ROW
// =============================================================================

function GlassRow({
  acordo,
  onViewDetail,
  isAlt,
}: {
  acordo: AcordoComParcelas;
  onViewDetail: () => void;
  isAlt: boolean;
}) {
  const urgency = getUrgency(acordo);
  const dias = getDiasRestantes(acordo);
  const tipoLabel = TIPO_LABELS[acordo.tipo];
  const direcaoLabel = DIRECAO_LABELS[acordo.direcao];
  const statusLabel = STATUS_LABELS[acordo.status];
  const isRecebimento = acordo.direcao === 'recebimento';
  const processo = acordo.processo;

  const progressoPct =
    acordo.totalParcelas > 0
      ? Math.round((acordo.parcelasPagas / acordo.totalParcelas) * 100)
      : 0;

  return (
    <button
      type="button"
      onClick={onViewDetail}
      className={cn(
        'group w-full text-left rounded-2xl border border-white/6 border-l-2 p-4 cursor-pointer',
        'transition-all duration-180 ease-out',
        'hover:bg-white/5 hover:border-white/12 hover:-translate-y-px hover:shadow-lg',
        isAlt ? 'bg-white/[0.018]' : 'bg-white/[0.028]',
        URGENCY_BORDER[urgency],
      )}
    >
      <div className="grid grid-cols-[32px_2.5fr_1fr_1fr_1fr_96px_40px] gap-3 items-center">
        {/* 1. Urgency dot */}
        <div className="flex items-center justify-center">
          <div className={cn('w-2 h-2 rounded-full shrink-0', URGENCY_DOT[urgency])} />
        </div>

        {/* 2. Processo / Tipo / Direção */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium tabular-nums truncate">
              {processo?.numero_processo || `Acordo #${acordo.id}`}
            </span>
            <SemanticBadge
              category="obrigacao_tipo"
              value={acordo.tipo}
              className="text-[9px] font-semibold"
            >
              {tipoLabel}
            </SemanticBadge>
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-semibold',
                isRecebimento
                  ? 'bg-success/10 text-success border border-success/20'
                  : 'bg-destructive/10 text-destructive border border-destructive/20',
              )}
            >
              {isRecebimento ? (
                <ArrowDown className="w-2.5 h-2.5" />
              ) : (
                <ArrowUp className="w-2.5 h-2.5" />
              )}
              {direcaoLabel}
            </span>
          </div>
          {(processo?.nome_parte_autora || processo?.nome_parte_re) && (
            <div className="text-[10px] text-muted-foreground/60 truncate mt-0.5">
              {processo?.nome_parte_autora || '—'}
              <span className="text-muted-foreground/40"> vs. </span>
              {processo?.nome_parte_re || '—'}
            </div>
          )}
          {processo?.descricao_orgao_julgador && (
            <div
              className="text-[10px] text-muted-foreground/45 mt-0.5 truncate"
              title={processo.descricao_orgao_julgador}
            >
              {processo.descricao_orgao_julgador}
            </div>
          )}
        </div>

        {/* 3. Próximo vencimento */}
        <div className="min-w-0">
          {acordo.proximoVencimento ? (
            <>
              <div className="text-[11px] tabular-nums">
                {format(parseISO(acordo.proximoVencimento), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
              </div>
              {dias !== null && (
                <div
                  className={cn(
                    'text-[9px] mt-0.5 tabular-nums',
                    dias < 0
                      ? 'text-destructive/70'
                      : dias === 0
                      ? 'text-warning/70'
                      : dias <= 7
                      ? 'text-primary/60'
                      : 'text-muted-foreground/50',
                  )}
                >
                  {dias < 0
                    ? `${Math.abs(dias)}d atraso`
                    : dias === 0
                    ? 'Vence hoje'
                    : `em ${dias}d`}
                </div>
              )}
            </>
          ) : (
            <span className="text-[11px] text-muted-foreground/40">Sem data</span>
          )}
        </div>

        {/* 4. Valor total */}
        <div className="min-w-0 flex items-center gap-1.5">
          <Wallet className="size-3 text-muted-foreground/40 shrink-0" />
          <span className="text-[11px] font-medium tabular-nums truncate">
            {CURRENCY.format(acordo.valorTotal)}
          </span>
        </div>

        {/* 5. Parcelas (progresso) */}
        <div className="min-w-0">
          <div className="text-[10px] text-muted-foreground/60 tabular-nums mb-1">
            {acordo.parcelasPagas}/{acordo.totalParcelas} pagas
          </div>
          <div className="h-1 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary/40 transition-all duration-700"
              style={{ width: `${progressoPct}%` }}
            />
          </div>
        </div>

        {/* 6. Status */}
        <div className="flex items-center justify-center">
          <SemanticBadge
            category="obrigacao_status"
            value={acordo.status}
            className="text-[10px]"
          >
            {statusLabel}
          </SemanticBadge>
        </div>

        {/* 7. Chevron */}
        <div className="flex items-center justify-end">
          <ChevronRight className="w-4 h-4 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </button>
  );
}

// =============================================================================
// SKELETON
// =============================================================================

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-white/6 bg-white/[0.028] p-4"
        >
          <div className="grid grid-cols-[32px_2.5fr_1fr_1fr_1fr_96px_40px] gap-3 items-center">
            <Skeleton className="w-2 h-2 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-48" />
              <Skeleton className="h-2.5 w-36" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2 w-14" />
            </div>
            <Skeleton className="h-3 w-20" />
            <div className="space-y-1">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-1 w-full rounded-full" />
            </div>
            <Skeleton className="h-5 w-16 rounded-md mx-auto" />
            <div />
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// EMPTY STATE
// =============================================================================

function GlassEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 opacity-60">
      <FileSearch className="w-10 h-10 text-muted-foreground/30 mb-4" />
      <p className="text-sm font-medium text-muted-foreground/50">
        Nenhuma obrigação encontrada
      </p>
      <p className="text-xs text-muted-foreground/30 mt-1">
        Tente ajustar os filtros ou criar uma nova obrigação
      </p>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ObrigacoesGlassList({
  acordos,
  isLoading,
  onViewDetail,
}: ObrigacoesGlassListProps) {
  if (isLoading) return <ListSkeleton />;
  if (acordos.length === 0) return <GlassEmptyState />;

  return (
    <div>
      <ColumnHeaders />
      <div className="flex flex-col gap-2">
        {acordos.map((acordo, i) => (
          <GlassRow
            key={acordo.id}
            acordo={acordo}
            onViewDetail={() => onViewDetail(acordo)}
            isAlt={i % 2 === 1}
          />
        ))}
      </div>
    </div>
  );
}
