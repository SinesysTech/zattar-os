'use client';

/**
 * DocumentosGlassList — Lista/Cards glass no padrão Glass Briefing.
 *
 * Espelha TemplatesGlassList/FormulariosGlassList/SegmentosGlassList.
 * Suporta modes `cards` e `list`, com skeletons e empty state.
 */

import * as React from 'react';
import {
  FileSignature,
  FileText,
  Camera,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  PenLine,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { ProgressRing } from '@/app/(authenticated)/dashboard/widgets/primitives';
import type {
  DocumentoCardData,
  DocStatus,
} from '@/shared/assinatura-digital/adapters/documento-card-adapter';
import { getSignerProgress, timeAgo } from '@/app/(authenticated)/assinatura-digital/components/documento-card';
import { Text } from '@/components/ui/typography';

// =============================================================================
// TIPOS
// =============================================================================

export type DocumentosViewMode = 'cards' | 'list';

interface DocumentosGlassListProps {
  documentos: DocumentoCardData[];
  isLoading?: boolean;
  mode?: DocumentosViewMode;
  selectedId?: number;
  onSelect?: (doc: DocumentoCardData) => void;
}

// =============================================================================
// STATUS HELPERS
// =============================================================================

const STATUS_CFG: Record<
  DocStatus,
  { label: string; icon: React.ElementType; dot: string; pill: string; tile: string; iconColor: string }
> = {
  rascunho: {
    label: 'Rascunho',
    icon: PenLine,
    dot: 'bg-muted-foreground',
    pill: 'bg-muted-foreground/10 border-muted-foreground/25 text-muted-foreground',
    tile: 'bg-muted-foreground/8',
    iconColor: 'text-muted-foreground/70',
  },
  pronto: {
    label: 'Aguardando',
    icon: Clock,
    dot: 'bg-info shadow-[0_0_6px_var(--info)]',
    pill: 'bg-info/10 border-info/25 text-info',
    tile: 'bg-info/10',
    iconColor: 'text-info/70',
  },
  concluido: {
    label: 'Concluído',
    icon: CheckCircle2,
    dot: 'bg-success shadow-[0_0_6px_var(--success)]',
    pill: 'bg-success/10 border-success/25 text-success',
    tile: 'bg-success/10',
    iconColor: 'text-success/70',
  },
  cancelado: {
    label: 'Cancelado',
    icon: XCircle,
    dot: 'bg-destructive',
    pill: 'bg-destructive/10 border-destructive/25 text-destructive',
    tile: 'bg-destructive/8',
    iconColor: 'text-destructive/70',
  },
};

// =============================================================================
// ROW
// =============================================================================

function GlassRow({
  doc,
  isAlt,
  isSelected,
  onSelect,
}: {
  doc: DocumentoCardData;
  isAlt: boolean;
  isSelected: boolean;
  onSelect?: (d: DocumentoCardData) => void;
}) {
  const cfg = STATUS_CFG[doc.status];
  const Icon = cfg.icon;
  const progress = getSignerProgress(doc);
  const hasPendingLong = doc.assinantes.some(
    (a) => a.status === 'pendente' && (a.diasPendente ?? 0) > 7,
  );

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-row-action]')) return;
    onSelect?.(doc);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(doc);
        }
      }}
      className={cn(
        /* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ 'w-full text-left rounded-2xl border p-4 cursor-pointer backdrop-blur-md',
        'transition-all duration-180 ease-out',
        'hover:border-border/70 hover:-translate-y-px hover:shadow-sm',
        isSelected
          ? 'border-primary/35 bg-primary/5'
          : isAlt
            ? 'border-border/30 bg-card/35'
            : 'border-border/40 bg-card/55',
        hasPendingLong && !isSelected && 'ring-1 ring-warning/15',
      )}
    >
      <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-3 items-center")}>
        {/* Status dot */}
        <span
          aria-hidden="true"
          className={cn('size-2 rounded-full shrink-0', cfg.dot)}
        />

        {/* Main info */}
        <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex items-center gap-3 min-w-0")}>
          <div
            className={cn(
              'size-9 rounded-[0.625rem] flex items-center justify-center shrink-0',
              cfg.tile,
            )}
          >
            <Icon className={cn('size-4', cfg.iconColor)} />
          </div>
          <div className="min-w-0">
            <p className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "text-body-sm font-semibold truncate")}>{doc.titulo}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {doc.criadoPor} · {timeAgo(doc.criadoEm)}
            </p>
          </div>
        </div>

        {/* Progress */}
        {doc.assinantes.length > 0 ? (
          <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-center gap-1.5 shrink-0")}>
            <ProgressRing
              percent={progress.percent}
              size={22}
              color={progress.percent === 100 ? 'var(--success)' : 'var(--primary)'}
            />
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {progress.signed}/{progress.total}
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground/60">—</span>
        )}

        {/* Flags */}
        <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-center gap-1.5 shrink-0")}>
          {doc.selfieHabilitada && (
            <span
              className="inline-flex size-6 items-center justify-center rounded-md bg-foreground/5"
              title="Selfie de verificação"
            >
              <Camera className="size-3 text-muted-foreground" />
            </span>
          )}
          {doc.origem === 'formulario' && (
            <span
              className="inline-flex size-6 items-center justify-center rounded-md bg-info/10"
              title="Origem: formulário"
            >
              <FileText className="size-3 text-info/70" />
            </span>
          )}
        </div>

        {/* Status pill */}
        <span
          className={cn(
            /* design-system-escape: gap-1.5 gap sem token DS; font-semibold → className de <Text>/<Heading>; px-2 padding direcional sem Inset equiv.; py-1 padding direcional sem Inset equiv. */ 'hidden sm:inline-flex items-center gap-1.5 backdrop-blur-sm rounded-lg text-[10px] font-semibold tracking-[0.04em] px-2 py-1 border whitespace-nowrap',
            cfg.pill,
          )}
        >
          {cfg.label}
        </span>

        <ChevronRight className="size-3.5 text-muted-foreground/60 shrink-0" />
      </div>
    </div>
  );
}

// =============================================================================
// CARD
// =============================================================================

function GlassCard({
  doc,
  isSelected,
  onSelect,
}: {
  doc: DocumentoCardData;
  isSelected: boolean;
  onSelect?: (d: DocumentoCardData) => void;
}) {
  const cfg = STATUS_CFG[doc.status];
  const Icon = cfg.icon;
  const progress = getSignerProgress(doc);
  const hasPendingLong = doc.assinantes.some(
    (a) => a.status === 'pendente' && (a.diasPendente ?? 0) > 7,
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(doc)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(doc);
        }
      }}
      className={cn(
        /* design-system-escape: gap-3 gap sem token DS; p-4 → migrar para <Inset variant="card-compact"> */ 'relative flex flex-col gap-3 rounded-2xl border p-4 cursor-pointer backdrop-blur-md',
        'transition-all duration-180 ease-out',
        'hover:border-border/70 hover:-translate-y-px hover:shadow-sm',
        isSelected ? 'border-primary/35 bg-primary/5' : 'border-border/40 bg-card/55',
        hasPendingLong && !isSelected && 'ring-1 ring-warning/15',
      )}
    >
      <div className={cn("flex items-start justify-between inline-tight")}>
        <div
          className={cn(
            'size-10 rounded-[0.625rem] flex items-center justify-center',
            cfg.tile,
          )}
        >
          <Icon className={cn('size-4', cfg.iconColor)} />
        </div>
        <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-center gap-1.5")}>
          <span
            aria-hidden="true"
            className={cn('size-2 rounded-full', cfg.dot)}
          />
          <span
            className={cn(
              /* design-system-escape: font-semibold → className de <Text>/<Heading>; px-2 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv. */ 'inline-flex items-center rounded-md text-[10px] font-semibold tracking-[0.04em] px-2 py-0.5 border',
              cfg.pill,
            )}
          >
            {cfg.label}
          </span>
        </div>
      </div>

      <div className="min-w-0">
        <p className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading>; leading-snug sem token DS */ "text-body-sm font-semibold line-clamp-2 leading-snug")}>
          {doc.titulo}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1 truncate">
          {doc.criadoPor} · {timeAgo(doc.criadoEm)}
        </p>
      </div>

      <div className={cn(/* design-system-escape: pt-2 padding direcional sem Inset equiv. */ "flex items-center justify-between inline-tight pt-2 border-t border-border/30")}>
        {doc.assinantes.length > 0 ? (
          <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-center gap-1.5")}>
            <ProgressRing
              percent={progress.percent}
              size={22}
              color={progress.percent === 100 ? 'var(--success)' : 'var(--primary)'}
            />
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {progress.signed}/{progress.total} assinantes
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground/60">
            Sem assinantes
          </span>
        )}

        <div className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex items-center gap-1")}>
          {doc.selfieHabilitada && (
            <Camera
              className="size-3 text-muted-foreground/60"
              aria-label="Selfie habilitada"
            />
          )}
          {doc.origem === 'formulario' && (
            <FileText
              className="size-3 text-info/70"
              aria-label="Origem: formulário"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SKELETONS & EMPTY
// =============================================================================

function ListSkeleton() {
  return (
    <div className={cn("flex flex-col inline-tight")}>
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className="h-18 rounded-2xl border border-border/30 bg-card/40 animate-pulse"
        />
      ))}
    </div>
  );
}

function CardsSkeleton() {
  return (
    <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3")}>
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="h-36 rounded-2xl border border-border/30 bg-card/40 animate-pulse"
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className={cn(/* design-system-escape: py-16 padding direcional sem Inset equiv. */ "flex flex-col items-center justify-center py-16 text-center")}>
      <FileSignature className="size-10 text-muted-foreground/55 mb-4" />
      <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-body-sm font-medium text-muted-foreground/60")}>
        Nenhum documento encontrado
      </p>
      <Text variant="caption" className="text-muted-foreground/70 mt-1">
        Tente ajustar os filtros ou a busca
      </Text>
    </div>
  );
}

// =============================================================================
// MAIN
// =============================================================================

export function DocumentosGlassList({
  documentos,
  isLoading = false,
  mode = 'list',
  selectedId,
  onSelect,
}: DocumentosGlassListProps) {
  if (isLoading) return mode === 'cards' ? <CardsSkeleton /> : <ListSkeleton />;
  if (documentos.length === 0) return <EmptyState />;

  if (mode === 'cards') {
    return (
      <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3")}>
        {documentos.map((doc) => (
          <GlassCard
            key={doc.uuid}
            doc={doc}
            isSelected={selectedId === doc.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col inline-tight")}>
      {documentos.map((doc, i) => (
        <GlassRow
          key={doc.uuid}
          doc={doc}
          isAlt={i % 2 === 1}
          isSelected={selectedId === doc.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
