'use client';

/**
 * SegmentosGlassList — Lista/Cards glass no padrão AudienciasGlassList.
 */

import * as React from 'react';
import { Tags, Pencil, Copy, Trash2, MoreHorizontal } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

import type { AssinaturaDigitalSegmento } from '@/shared/assinatura-digital';
import { Text } from '@/components/ui/typography';

// =============================================================================
// TIPOS
// =============================================================================

export type SegmentosViewMode = 'cards' | 'list';

interface SegmentosGlassListProps {
  segmentos: AssinaturaDigitalSegmento[];
  isLoading: boolean;
  mode?: SegmentosViewMode;
  onEdit?: (s: AssinaturaDigitalSegmento) => void;
  onDuplicate?: (s: AssinaturaDigitalSegmento) => void;
  onDelete?: (s: AssinaturaDigitalSegmento) => void;
  canEdit?: boolean;
  canCreate?: boolean;
  canDelete?: boolean;
}

// =============================================================================
// HELPERS
// =============================================================================

function getAtivoDotColor(ativo: boolean): string {
  return ativo
    ? 'bg-success shadow-[0_0_6px_var(--success)]'
    : 'bg-muted-foreground';
}

function getSegmentoChartToken(id: number): string {
  const index = (Math.abs(id) % 8) + 1;
  return `--chart-${index}`;
}

// =============================================================================
// ACTIONS
// =============================================================================

function SegmentoActions({
  segmento,
  onEdit,
  onDuplicate,
  onDelete,
  canEdit,
  canCreate,
  canDelete,
  compact = false,
}: {
  segmento: AssinaturaDigitalSegmento;
  onEdit?: (s: AssinaturaDigitalSegmento) => void;
  onDuplicate?: (s: AssinaturaDigitalSegmento) => void;
  onDelete?: (s: AssinaturaDigitalSegmento) => void;
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Ações"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          {canEdit && onEdit && (
            <DropdownMenuItem onClick={() => onEdit(segmento)}>
              <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
            </DropdownMenuItem>
          )}
          {canCreate && onDuplicate && (
            <DropdownMenuItem onClick={() => onDuplicate(segmento)}>
              <Copy className="w-3.5 h-3.5 mr-2" /> Duplicar
            </DropdownMenuItem>
          )}
          {canDelete && onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(segmento)} className="text-destructive">
                <Trash2 className="w-3.5 h-3.5 mr-2" /> Deletar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      {canEdit && onEdit && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label="Editar segmento"
              onClick={(e) => { e.stopPropagation(); onEdit(segmento); }}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Editar</TooltipContent>
        </Tooltip>
      )}
      {canCreate && onDuplicate && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label="Duplicar segmento"
              onClick={(e) => { e.stopPropagation(); onDuplicate(segmento); }}
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Duplicar</TooltipContent>
        </Tooltip>
      )}
      {canDelete && onDelete && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label="Deletar segmento"
              onClick={(e) => { e.stopPropagation(); onDelete(segmento); }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Deletar</TooltipContent>
        </Tooltip>
      )}
    </>
  );
}

// =============================================================================
// ROW
// =============================================================================

function GlassRow({
  segmento,
  onEdit,
  onDuplicate,
  onDelete,
  canEdit,
  canCreate,
  canDelete,
  isAlt,
}: {
  segmento: AssinaturaDigitalSegmento;
  onEdit?: (s: AssinaturaDigitalSegmento) => void;
  onDuplicate?: (s: AssinaturaDigitalSegmento) => void;
  onDelete?: (s: AssinaturaDigitalSegmento) => void;
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
  isAlt: boolean;
}) {
  const token = getSegmentoChartToken(segmento.id);

  const handleRowClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-row-action]')) return;
    onEdit?.(segmento);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleRowClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit?.(segmento);
        }
      }}
      className={cn(
        'w-full text-left rounded-2xl border border-border/40 inset-card-compact cursor-pointer bg-card',
        'transition-all duration-180 ease-out',
        'hover:bg-accent/40 hover:border-border/60 hover:scale-[1.0025] hover:-translate-y-px hover:shadow-lg',
        isAlt && 'bg-muted/20',
      )}
    >
      <div className={cn("grid grid-cols-[auto_1fr_auto_90px_120px] inline-default items-center")}>
        {/* Status dot */}
        <div className="flex items-center w-4">
          <div className={cn('w-2 h-2 rounded-full shrink-0', getAtivoDotColor(segmento.ativo))} />
        </div>

        {/* Main info */}
        <div className={cn("flex items-center inline-medium min-w-0")}>
          <div
            className="w-9 h-9 rounded-[0.625rem] flex items-center justify-center shrink-0"
            style={{ background: `color-mix(in oklch, var(${token}) 14%, transparent)` }}
          >
            <Tags className="w-4 h-4" style={{ color: `var(${token})` }} />
          </div>
          <div className="min-w-0">
            <div className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "text-body-sm font-semibold truncate")}>{segmento.nome}</div>
            {segmento.descricao && (
              <Text variant="caption" className="mt-0.5 line-clamp-1">
                {segmento.descricao}
              </Text>
            )}
            <div className="text-[10px] text-muted-foreground/70 mt-0.5 font-mono truncate">
              {segmento.slug}
            </div>
          </div>
        </div>

        {/* Uso */}
        <span className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading>; px-2 padding direcional sem Inset equiv.; py-1 padding direcional sem Inset equiv. */ "inline-flex backdrop-blur-sm rounded-lg text-[11px] font-semibold tracking-[0.04em] px-2 py-1 bg-foreground/6 border border-foreground/10 text-muted-foreground")}>
          <span className="tabular-nums">{segmento.formularios_count ?? 0}</span>
          <span className="ml-1 opacity-60">
            formulário{(segmento.formularios_count ?? 0) !== 1 ? 's' : ''}
          </span>
        </span>

        {/* Status */}
        <div className="flex justify-start">
          <span
            className={cn(
              /* design-system-escape: font-semibold → className de <Text>/<Heading>; px-2 padding direcional sem Inset equiv.; py-1 padding direcional sem Inset equiv. */ 'inline-flex items-center inline-snug backdrop-blur-sm rounded-lg text-[10px] font-semibold tracking-[0.04em] px-2 py-1 border whitespace-nowrap',
              segmento.ativo
                ? 'bg-success/10 border-success/25 text-success'
                : 'bg-muted-foreground/10 border-muted-foreground/25 text-muted-foreground',
            )}
          >
            {segmento.ativo ? 'Ativo' : 'Inativo'}
          </span>
        </div>

        {/* Actions */}
        <div className={cn("flex items-center justify-end inline-nano")} data-row-action>
          <SegmentoActions
            segmento={segmento}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            canEdit={canEdit}
            canCreate={canCreate}
            canDelete={canDelete}
          />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// CARD
// =============================================================================

function GlassCard({
  segmento,
  onEdit,
  onDuplicate,
  onDelete,
  canEdit,
  canCreate,
  canDelete,
}: {
  segmento: AssinaturaDigitalSegmento;
  onEdit?: (s: AssinaturaDigitalSegmento) => void;
  onDuplicate?: (s: AssinaturaDigitalSegmento) => void;
  onDelete?: (s: AssinaturaDigitalSegmento) => void;
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
}) {
  const token = getSegmentoChartToken(segmento.id);

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-row-action]')) return;
    onEdit?.(segmento);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit?.(segmento);
        }
      }}
      className={cn(
        'relative flex flex-col inline-medium rounded-2xl border border-border/40 bg-card inset-card-compact cursor-pointer',
        'transition-all duration-180 ease-out',
        'hover:bg-accent/40 hover:border-border/60 hover:-translate-y-px hover:shadow-lg',
      )}
    >
      <div className={cn("flex items-start justify-between inline-tight")}>
        <div
          className="w-10 h-10 rounded-[0.625rem] flex items-center justify-center"
          style={{ background: `color-mix(in oklch, var(${token}) 14%, transparent)` }}
        >
          <Tags className="w-4 h-4" style={{ color: `var(${token})` }} />
        </div>
        <div className={cn("flex items-center inline-snug")} data-row-action>
          <div className={cn('w-2 h-2 rounded-full', getAtivoDotColor(segmento.ativo))} />
          <SegmentoActions
            segmento={segmento}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            canEdit={canEdit}
            canCreate={canCreate}
            canDelete={canDelete}
            compact
          />
        </div>
      </div>

      <div>
        <div className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "text-body-sm font-semibold line-clamp-1")}>{segmento.nome}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5 font-mono truncate">
          {segmento.slug}
        </div>
      </div>

      {segmento.descricao ? (
        <Text variant="caption" className="line-clamp-3 flex-1">{segmento.descricao}</Text>
      ) : (
        <Text variant="caption" className="text-muted-foreground/65 italic flex-1">Sem descrição</Text>
      )}

      <div className={cn(/* design-system-escape: pt-2 padding direcional sem Inset equiv. */ "flex items-center justify-between inline-tight pt-2 border-t border-border/40")}>
        <span className="text-[10px] text-muted-foreground">
          <span className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading> */ "font-display text-body-sm font-bold tabular-nums text-foreground/80")}>
            {segmento.formularios_count ?? 0}
          </span>
          <span className="ml-1">
            formulário{(segmento.formularios_count ?? 0) !== 1 ? 's' : ''}
          </span>
        </span>
        <span
          className={cn(
            /* design-system-escape: font-semibold → className de <Text>/<Heading>; px-2 padding direcional sem Inset equiv.; py-1 padding direcional sem Inset equiv. */ 'inline-flex items-center inline-snug rounded-lg text-[10px] font-semibold tracking-[0.04em] px-2 py-1 border',
            segmento.ativo
              ? 'bg-success/10 border-success/25 text-success'
              : 'bg-muted-foreground/10 border-muted-foreground/25 text-muted-foreground',
          )}
        >
          {segmento.ativo ? 'Ativo' : 'Inativo'}
        </span>
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
        <div key={i} className="h-20 rounded-2xl border border-border/40 bg-card animate-pulse" />
      ))}
    </div>
  );
}

function CardsSkeleton() {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 inline-medium")}>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-44 rounded-2xl border border-border/40 bg-card animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className={cn(/* design-system-escape: py-16 padding direcional sem Inset equiv. */ "flex flex-col items-center justify-center py-16 opacity-60")}>
      <Tags className="w-10 h-10 text-muted-foreground/55 mb-4" />
      <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-body-sm font-medium text-muted-foreground/70")}>Nenhum segmento encontrado</p>
      <Text variant="caption" className="text-muted-foreground/55 mt-1">Tente ajustar os filtros ou criar um novo segmento</Text>
    </div>
  );
}

// =============================================================================
// MAIN
// =============================================================================

export function SegmentosGlassList({
  segmentos,
  isLoading,
  mode = 'list',
  onEdit,
  onDuplicate,
  onDelete,
  canEdit = false,
  canCreate = false,
  canDelete = false,
}: SegmentosGlassListProps) {
  if (isLoading) return mode === 'cards' ? <CardsSkeleton /> : <ListSkeleton />;
  if (segmentos.length === 0) return <EmptyState />;

  return (
    <TooltipProvider>
      {mode === 'cards' ? (
        <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 inline-medium")}>
          {segmentos.map((s) => (
            <GlassCard
              key={s.id}
              segmento={s}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              canEdit={canEdit}
              canCreate={canCreate}
              canDelete={canDelete}
            />
          ))}
        </div>
      ) : (
        <div className={cn("flex flex-col inline-tight")}>
          {segmentos.map((s, i) => (
            <GlassRow
              key={s.id}
              segmento={s}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              canEdit={canEdit}
              canCreate={canCreate}
              canDelete={canDelete}
              isAlt={i % 2 === 1}
            />
          ))}
        </div>
      )}
    </TooltipProvider>
  );
}
