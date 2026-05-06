'use client';

/**
 * TemplatesGlassList — Lista/Cards glass no padrão AudienciasGlassList.
 */

import * as React from 'react';
import {
  FileText,
  FileCode2,
  Pencil,
  Copy,
  Trash2,
  MoreHorizontal,
} from 'lucide-react';

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

import type { Template } from '@/shared/assinatura-digital';
import { formatFileSize, getTemplateDisplayName } from '@/shared/assinatura-digital';
import { Text } from '@/components/ui/typography';

// =============================================================================
// TIPOS
// =============================================================================

export type TemplatesViewMode = 'cards' | 'list';

interface TemplatesGlassListProps {
  templates: Template[];
  isLoading: boolean;
  mode?: TemplatesViewMode;
  onEdit?: (template: Template) => void;
  onDuplicate?: (template: Template) => void;
  onDelete?: (template: Template) => void;
  canEdit?: boolean;
  canCreate?: boolean;
  canDelete?: boolean;
}

// =============================================================================
// HELPERS
// =============================================================================

function getStatusDotColor(status: string): string {
  switch (status) {
    case 'ativo':
      return 'bg-success shadow-[0_0_6px_var(--success)]';
    case 'rascunho':
      return 'bg-warning shadow-[0_0_6px_var(--warning)]';
    case 'inativo':
      return 'bg-muted-foreground';
    default:
      return 'bg-muted-foreground';
  }
}

function getStatusLabel(status: string): string {
  if (status === 'ativo') return 'Ativo';
  if (status === 'rascunho') return 'Rascunho';
  return 'Inativo';
}

function getStatusPillClass(status: string): string {
  if (status === 'ativo') return 'bg-success/10 border-success/25 text-success';
  if (status === 'rascunho') return 'bg-warning/10 border-warning/25 text-warning';
  return 'bg-muted-foreground/10 border-muted-foreground/25 text-muted-foreground';
}

// =============================================================================
// ACTIONS
// =============================================================================

function TemplateActions({
  template,
  onEdit,
  onDuplicate,
  onDelete,
  canEdit,
  canCreate,
  canDelete,
  compact = false,
}: {
  template: Template;
  onEdit?: (t: Template) => void;
  onDuplicate?: (t: Template) => void;
  onDelete?: (t: Template) => void;
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
            <DropdownMenuItem onClick={() => onEdit(template)}>
              <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
            </DropdownMenuItem>
          )}
          {canCreate && onDuplicate && (
            <DropdownMenuItem onClick={() => onDuplicate(template)}>
              <Copy className="w-3.5 h-3.5 mr-2" /> Duplicar
            </DropdownMenuItem>
          )}
          {canDelete && onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(template)} className="text-destructive">
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
              aria-label="Editar template"
              onClick={(e) => { e.stopPropagation(); onEdit(template); }}
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
              aria-label="Duplicar template"
              onClick={(e) => { e.stopPropagation(); onDuplicate(template); }}
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
              aria-label="Deletar template"
              onClick={(e) => { e.stopPropagation(); onDelete(template); }}
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
  template,
  onEdit,
  onDuplicate,
  onDelete,
  canEdit,
  canCreate,
  canDelete,
  isAlt,
}: {
  template: Template;
  onEdit?: (t: Template) => void;
  onDuplicate?: (t: Template) => void;
  onDelete?: (t: Template) => void;
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
  isAlt: boolean;
}) {
  const displayName = getTemplateDisplayName(template);
  const isMarkdown = template.tipo_template === 'markdown';
  const Icon = isMarkdown ? FileCode2 : FileText;
  const status = template.status;

  const handleRowClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-row-action]')) return;
    onEdit?.(template);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleRowClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit?.(template);
        }
      }}
      className={cn(
        'w-full text-left rounded-2xl border border-border/40 inset-card-compact cursor-pointer bg-card',
        'transition-all duration-180 ease-out',
        'hover:bg-accent/40 hover:border-border/60 hover:scale-[1.0025] hover:-translate-y-px hover:shadow-lg',
        isAlt && 'bg-muted/20',
      )}
    >
      <div className={cn("grid grid-cols-[auto_1fr_auto_auto_90px_120px] inline-default items-center")}>
        {/* Status dot */}
        <div className="flex items-center w-4">
          <div className={cn('w-2 h-2 rounded-full shrink-0', getStatusDotColor(status))} />
        </div>

        {/* Main info */}
        <div className={cn("flex items-center inline-medium min-w-0")}>
          <div className="w-9 h-9 rounded-[0.625rem] bg-primary/8 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className={cn("flex items-center inline-tight flex-wrap")}>
              <span className={cn( "text-body-sm font-semibold truncate")}>{displayName}</span>
              <span
                className={cn(
                  /* design-system-escape: px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; */ 'inline-flex items-center inline-micro rounded px-1.5 py-0.5 text-[10px] font-semibold border',
                  isMarkdown
                    ? 'bg-info/10 border-info/25 text-info'
                    : 'bg-destructive/10 border-destructive/25 text-destructive',
                )}
              >
                {isMarkdown ? 'Markdown' : 'PDF'}
              </span>
            </div>
            {template.descricao && (
              <Text variant="caption" className="mt-0.5 line-clamp-1">
                {template.descricao}
              </Text>
            )}
          </div>
        </div>

        {/* Versão */}
        <span className={cn(/* design-system-escape: px-2 padding direcional sem Inset equiv.; py-1 padding direcional sem Inset equiv. */ "inline-flex backdrop-blur-sm rounded-lg text-[11px] font-semibold tracking-[0.04em] px-2 py-1 bg-foreground/6 border border-foreground/10 text-muted-foreground")}>
          v{template.versao}
        </span>

        {/* Tamanho */}
        <Text variant="caption" className="tabular-nums whitespace-nowrap">
          {formatFileSize(template.arquivo_tamanho || 0)}
        </Text>

        {/* Status pill */}
        <div className="flex justify-start">
          <span
            className={cn(
              /* design-system-escape: px-2 padding direcional sem Inset equiv.; py-1 padding direcional sem Inset equiv. */ 'inline-flex items-center inline-snug backdrop-blur-sm rounded-lg text-[10px] font-semibold tracking-[0.04em] px-2 py-1 border whitespace-nowrap',
              getStatusPillClass(status),
            )}
          >
            {getStatusLabel(status)}
          </span>
        </div>

        {/* Actions */}
        <div className={cn("flex items-center justify-end inline-nano")} data-row-action>
          <TemplateActions
            template={template}
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
  template,
  onEdit,
  onDuplicate,
  onDelete,
  canEdit,
  canCreate,
  canDelete,
}: {
  template: Template;
  onEdit?: (t: Template) => void;
  onDuplicate?: (t: Template) => void;
  onDelete?: (t: Template) => void;
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
}) {
  const displayName = getTemplateDisplayName(template);
  const isMarkdown = template.tipo_template === 'markdown';
  const Icon = isMarkdown ? FileCode2 : FileText;
  const status = template.status;

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-row-action]')) return;
    onEdit?.(template);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit?.(template);
        }
      }}
      className={cn(
        'relative flex flex-col inline-medium rounded-2xl border border-border/40 bg-card inset-card-compact cursor-pointer',
        'transition-all duration-180 ease-out',
        'hover:bg-accent/40 hover:border-border/60 hover:-translate-y-px hover:shadow-lg',
      )}
    >
      <div className={cn("flex items-start justify-between inline-tight")}>
        <div className="w-10 h-10 rounded-[0.625rem] bg-primary/8 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className={cn("flex items-center inline-snug")} data-row-action>
          <div className={cn('w-2 h-2 rounded-full', getStatusDotColor(status))} />
          <TemplateActions
            template={template}
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
        <div className={cn("flex items-center inline-tight flex-wrap")}>
          <span className={cn( "text-body-sm font-semibold line-clamp-1")}>{displayName}</span>
        </div>
        <div className={cn("mt-1 flex items-center inline-tight")}>
          <span
            className={cn(
              /* design-system-escape: px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; */ 'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold border',
              isMarkdown
                ? 'bg-info/10 border-info/25 text-info'
                : 'bg-destructive/10 border-destructive/25 text-destructive',
            )}
          >
            {isMarkdown ? 'Markdown' : 'PDF'}
          </span>
          <span className="text-[10px] text-muted-foreground">v{template.versao}</span>
        </div>
      </div>

      {template.descricao ? (
        <Text variant="caption" className="line-clamp-3 flex-1">{template.descricao}</Text>
      ) : (
        <Text variant="caption" className="text-muted-foreground/65 italic flex-1">Sem descrição</Text>
      )}

      <div className={cn("flex items-center justify-between inline-tight pt-2 border-t border-border/40")}>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {formatFileSize(template.arquivo_tamanho || 0)}
        </span>
        <span
          className={cn(
            /* design-system-escape: px-2 padding direcional sem Inset equiv.; py-1 padding direcional sem Inset equiv. */ 'inline-flex items-center inline-snug rounded-lg text-[10px] font-semibold tracking-[0.04em] px-2 py-1 border',
            getStatusPillClass(status),
          )}
        >
          {getStatusLabel(status)}
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
    <div className={cn("flex flex-col items-center justify-center py-16 opacity-60")}>
      <FileText className="w-10 h-10 text-muted-foreground/55 mb-4" />
      <p className={cn( "text-body-sm font-medium text-muted-foreground/70")}>Nenhum template encontrado</p>
      <Text variant="caption" className="text-muted-foreground/55 mt-1">Tente ajustar os filtros ou criar um novo template</Text>
    </div>
  );
}

// =============================================================================
// MAIN
// =============================================================================

export function TemplatesGlassList({
  templates,
  isLoading,
  mode = 'list',
  onEdit,
  onDuplicate,
  onDelete,
  canEdit = false,
  canCreate = false,
  canDelete = false,
}: TemplatesGlassListProps) {
  if (isLoading) return mode === 'cards' ? <CardsSkeleton /> : <ListSkeleton />;
  if (templates.length === 0) return <EmptyState />;

  return (
    <TooltipProvider>
      {mode === 'cards' ? (
        <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 inline-medium")}>
          {templates.map((t) => (
            <GlassCard
              key={t.id}
              template={t}
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
          {templates.map((t, i) => (
            <GlassRow
              key={t.id}
              template={t}
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
