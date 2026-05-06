'use client';

import * as React from 'react';
import { parseISO, format, differenceInCalendarDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  FileSearch,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Skeleton } from '@/components/ui/skeleton';

import type { AcordoComParcelas } from '../../domain';
import { STATUS_LABELS, TIPO_LABELS, DIRECAO_LABELS } from '../../domain';
import { GRAU_TRIBUNAL_LABELS } from '@/app/(authenticated)/expedientes';
import { Text } from '@/components/ui/typography';

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
  critico: 'border-l-[3px] border-l-destructive',
  alto: 'border-l-[3px] border-l-warning',
  medio: 'border-l-[3px] border-l-info',
  baixo: 'border-l-[3px] border-l-success',
  ok: 'border-l-[3px] border-l-border/20',
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
// GLASS ROW
// =============================================================================

function GlassRow({
  acordo,
  onViewDetail,
}: {
  acordo: AcordoComParcelas;
  onViewDetail: () => void;
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

  const parteAutora = processo?.nome_parte_autora;
  const parteRe = processo?.nome_parte_re;
  const numeroProcesso = processo?.numero_processo;
  const trt = processo?.trt;
  const grau = processo?.grau;
  const grauLabel = grau
    ? GRAU_TRIBUNAL_LABELS[grau as keyof typeof GRAU_TRIBUNAL_LABELS] ?? grau
    : null;
  const orgaoJulgador = processo?.descricao_orgao_julgador;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onViewDetail}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onViewDetail();
        }
      }}
      className={cn(
        'group w-full text-left rounded-2xl border border-border/60 bg-card inset-card-compact cursor-pointer',
        'transition-all duration-180 ease-out',
        'hover:border-border hover:shadow-[0_4px_14px_rgba(0,0,0,0.06)] hover:-translate-y-px',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        URGENCY_BORDER[urgency],
      )}
    >
      <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "grid grid-cols-[32px_2.5fr_1fr_1fr_1fr_96px_40px] gap-3 items-center")}>
        {/* 1. Urgency dot */}
        <div className="flex items-center justify-center">
          <div className={cn('w-2 h-2 rounded-full shrink-0', URGENCY_DOT[urgency])} />
        </div>

        {/* 2. Partes / Processo com TRT+Grau / Órgão julgador */}
        <div className="min-w-0">
          {/* Linha 1: Nome das partes */}
          <div className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-body-sm font-medium text-foreground/90 truncate")}>
            {parteAutora || parteRe ? (
              <>
                {parteAutora || '—'}
                <span className="text-muted-foreground/40"> vs. </span>
                {parteRe || '—'}
              </>
            ) : (
              `Acordo #${acordo.id}`
            )}
          </div>

          {/* Linha 2: [TRT] [Grau] Número do processo */}
          <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-center gap-1.5 mt-0.5 flex-wrap")}>
            {trt && (
              <SemanticBadge
                category="tribunal"
                value={trt}
                className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "text-[9px] font-semibold")}
              >
                {trt}
              </SemanticBadge>
            )}
            {grau && grauLabel && (
              <SemanticBadge
                category="grau"
                value={grau}
                className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "text-[9px] font-semibold")}
              >
                {grauLabel}
              </SemanticBadge>
            )}
            {numeroProcesso && (
              <span className="text-[11px] text-muted-foreground/70 tabular-nums truncate">
                {numeroProcesso}
              </span>
            )}
          </div>

          {/* Linha 3: Órgão julgador */}
          {orgaoJulgador && (
            <div
              className="text-[10px] text-muted-foreground/55 mt-0.5 truncate"
              title={orgaoJulgador}
            >
              {orgaoJulgador}
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

        {/* 4. Tipo + Valor com direção */}
        <div className="min-w-0">
          <SemanticBadge
            category="obrigacao_tipo"
            value={acordo.tipo}
            className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "text-[9px] font-semibold")}
          >
            {tipoLabel}
          </SemanticBadge>
          <div className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex items-center gap-1 mt-1")}>
            {isRecebimento ? (
              <ArrowDown className="size-3 text-success/70 shrink-0" />
            ) : (
              <ArrowUp className="size-3 text-destructive/70 shrink-0" />
            )}
            <span
              className={cn(
                /* design-system-escape: font-medium → className de <Text>/<Heading> */ 'text-[11px] font-medium tabular-nums truncate',
                isRecebimento ? 'text-success/90' : 'text-destructive/90',
              )}
              title={`${direcaoLabel} · ${CURRENCY.format(acordo.valorTotal)}`}
            >
              {CURRENCY.format(acordo.valorTotal)}
            </span>
          </div>
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
    </div>
  );
}

// =============================================================================
// SKELETON
// =============================================================================

function ListSkeleton() {
  return (
    <div className={cn("flex flex-col inline-tight")}>
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className={cn("rounded-2xl border border-border/40 bg-card inset-card-compact")}
        >
          <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "grid grid-cols-[32px_2.5fr_1fr_1fr_1fr_96px_40px] gap-3 items-center")}>
            <Skeleton className="w-2 h-2 rounded-full" />
            <div className={cn(/* design-system-escape: space-y-1.5 sem token DS */ "space-y-1.5")}>
              <Skeleton className="h-3.5 w-48" />
              <Skeleton className="h-2.5 w-36" />
            </div>
            <div className={cn(/* design-system-escape: space-y-1 sem token DS */ "space-y-1")}>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2 w-14" />
            </div>
            <Skeleton className="h-3 w-20" />
            <div className={cn(/* design-system-escape: space-y-1 sem token DS */ "space-y-1")}>
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
    <div className={cn(/* design-system-escape: py-16 padding direcional sem Inset equiv. */ "flex flex-col items-center justify-center py-16 opacity-60")}>
      <FileSearch className="w-10 h-10 text-muted-foreground/30 mb-4" />
      <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-body-sm font-medium text-muted-foreground/50")}>
        Nenhuma obrigação encontrada
      </p>
      <Text variant="caption" className="text-muted-foreground/30 mt-1">
        Tente ajustar os filtros ou criar uma nova obrigação
      </Text>
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
    <div className={cn("flex flex-col inline-tight")}>
      {acordos.map((acordo) => (
        <GlassRow
          key={acordo.id}
          acordo={acordo}
          onViewDetail={() => onViewDetail(acordo)}
        />
      ))}
    </div>
  );
}
