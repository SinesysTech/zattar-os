'use client';

/**
 * FormulariosGlassList — Lista/Cards glass no padrão AudienciasGlassList.
 */

import * as React from 'react';
import {
  ClipboardList,
  Pencil,
  Link2,
  Trash2,
  Camera,
  MapPin,
  Code2,
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

import type { AssinaturaDigitalFormulario } from '@/shared/assinatura-digital';
import { getFormularioDisplayName } from '@/shared/assinatura-digital';
import { Text } from '@/components/ui/typography';

// =============================================================================
// TIPOS
// =============================================================================

export type FormulariosViewMode = 'cards' | 'list';

interface FormulariosGlassListProps {
  formularios: AssinaturaDigitalFormulario[];
  isLoading: boolean;
  mode?: FormulariosViewMode;
  onEdit?: (f: AssinaturaDigitalFormulario) => void;
  onEditSchema?: (f: AssinaturaDigitalFormulario) => void;
  onCopyLink?: (f: AssinaturaDigitalFormulario) => void;
  onDelete?: (f: AssinaturaDigitalFormulario) => void;
  canEdit?: boolean;
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

// =============================================================================
// ROW (lista)
// =============================================================================

function GlassRow({
  formulario,
  onEdit,
  onEditSchema,
  onCopyLink,
  onDelete,
  canEdit,
  canDelete,
  isAlt,
}: {
  formulario: AssinaturaDigitalFormulario;
  onEdit?: (f: AssinaturaDigitalFormulario) => void;
  onEditSchema?: (f: AssinaturaDigitalFormulario) => void;
  onCopyLink?: (f: AssinaturaDigitalFormulario) => void;
  onDelete?: (f: AssinaturaDigitalFormulario) => void;
  canEdit: boolean;
  canDelete: boolean;
  isAlt: boolean;
}) {
  const displayName = getFormularioDisplayName(formulario);
  const segmentoNome = formulario.segmento?.nome;

  const handleRowClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-row-action]')) return;
    onEdit?.(formulario);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleRowClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit?.(formulario);
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
          <div className={cn('w-2 h-2 rounded-full shrink-0', getAtivoDotColor(formulario.ativo))} />
        </div>

        {/* Main info */}
        <div className={cn("flex items-center inline-medium min-w-0")}>
          <div className="w-9 h-9 rounded-[0.625rem] bg-primary/8 flex items-center justify-center shrink-0">
            <ClipboardList className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className={cn("flex items-center inline-tight flex-wrap")}>
              <span className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "text-body-sm font-semibold truncate")}>{displayName}</span>
              {segmentoNome && (
                <span className={cn(/* design-system-escape: px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; font-semibold → className de <Text>/<Heading> */ "inline-flex items-center inline-micro bg-primary/10 border border-primary/20 text-primary/80 rounded px-1.5 py-0.5 text-[10px] font-semibold")}>
                  {segmentoNome}
                </span>
              )}
            </div>
            {formulario.descricao && (
              <Text variant="caption" className="mt-0.5 line-clamp-1">
                {formulario.descricao}
              </Text>
            )}
            <div className="text-[10px] text-muted-foreground/70 mt-0.5 font-mono truncate">
              {formulario.slug}
            </div>
          </div>
        </div>

        {/* Captura badges */}
        <div className={cn("flex items-center inline-snug")}>
          {formulario.foto_necessaria && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={cn(/* design-system-escape: px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; font-semibold → className de <Text>/<Heading> */ "inline-flex items-center inline-micro bg-info/10 border border-info/25 text-info rounded px-1.5 py-0.5 text-[10px] font-semibold")}>
                  <Camera className="w-2.5 h-2.5" />
                  Foto
                </span>
              </TooltipTrigger>
              <TooltipContent>Captura selfie do assinante</TooltipContent>
            </Tooltip>
          )}
          {formulario.geolocation_necessaria && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={cn(/* design-system-escape: px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; font-semibold → className de <Text>/<Heading> */ "inline-flex items-center inline-micro bg-warning/10 border border-warning/25 text-warning rounded px-1.5 py-0.5 text-[10px] font-semibold")}>
                  <MapPin className="w-2.5 h-2.5" />
                  Geo
                </span>
              </TooltipTrigger>
              <TooltipContent>Registra coordenadas</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Status pill */}
        <div className="flex justify-start">
          <span
            className={cn(
              /* design-system-escape: font-semibold → className de <Text>/<Heading>; px-2 padding direcional sem Inset equiv.; py-1 padding direcional sem Inset equiv. */ 'inline-flex items-center inline-snug backdrop-blur-sm rounded-lg text-[10px] font-semibold tracking-[0.04em] px-2 py-1 border whitespace-nowrap',
              formulario.ativo
                ? 'bg-success/10 border-success/25 text-success'
                : 'bg-muted-foreground/10 border-muted-foreground/25 text-muted-foreground',
            )}
          >
            {formulario.ativo ? 'Ativo' : 'Inativo'}
          </span>
        </div>

        {/* Actions */}
        <div className={cn("flex items-center justify-end inline-nano")} data-row-action>
          <FormularioActions
            formulario={formulario}
            onEdit={onEdit}
            onEditSchema={onEditSchema}
            onCopyLink={onCopyLink}
            onDelete={onDelete}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// CARD (grid)
// =============================================================================

function GlassCard({
  formulario,
  onEdit,
  onEditSchema,
  onCopyLink,
  onDelete,
  canEdit,
  canDelete,
}: {
  formulario: AssinaturaDigitalFormulario;
  onEdit?: (f: AssinaturaDigitalFormulario) => void;
  onEditSchema?: (f: AssinaturaDigitalFormulario) => void;
  onCopyLink?: (f: AssinaturaDigitalFormulario) => void;
  onDelete?: (f: AssinaturaDigitalFormulario) => void;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const displayName = getFormularioDisplayName(formulario);
  const segmentoNome = formulario.segmento?.nome;

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-row-action]')) return;
    onEdit?.(formulario);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit?.(formulario);
        }
      }}
      className={cn(
        'relative flex flex-col inline-medium rounded-2xl border border-border/40 bg-card inset-card-compact cursor-pointer',
        'transition-all duration-180 ease-out',
        'hover:bg-accent/40 hover:border-border/60 hover:-translate-y-px hover:shadow-lg',
      )}
    >
      {/* Top row: icon + status dot + menu */}
      <div className={cn("flex items-start justify-between inline-tight")}>
        <div className="w-10 h-10 rounded-[0.625rem] bg-primary/8 flex items-center justify-center">
          <ClipboardList className="w-4 h-4 text-primary" />
        </div>
        <div className={cn("flex items-center inline-snug")} data-row-action>
          <div className={cn('w-2 h-2 rounded-full', getAtivoDotColor(formulario.ativo))} />
          <FormularioActions
            formulario={formulario}
            onEdit={onEdit}
            onEditSchema={onEditSchema}
            onCopyLink={onCopyLink}
            onDelete={onDelete}
            canEdit={canEdit}
            canDelete={canDelete}
            compact
          />
        </div>
      </div>

      {/* Title */}
      <div>
        <div className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "text-body-sm font-semibold line-clamp-1")}>{displayName}</div>
        {segmentoNome && (
          <div className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading>; tracking-wider sem token DS */ "mt-1 text-[10px] font-semibold uppercase tracking-wider text-primary/70")}>
            {segmentoNome}
          </div>
        )}
      </div>

      {/* Descrição */}
      {formulario.descricao ? (
        <Text variant="caption" className="line-clamp-3 flex-1">
          {formulario.descricao}
        </Text>
      ) : (
        <Text variant="caption" className="text-muted-foreground/65 italic flex-1">Sem descrição</Text>
      )}

      {/* Footer: captura + status */}
      <div className={cn(/* design-system-escape: pt-2 padding direcional sem Inset equiv. */ "flex items-center justify-between inline-tight pt-2 border-t border-border/40")}>
        <div className={cn("flex items-center inline-snug")}>
          {formulario.foto_necessaria && (
            <span className={cn(/* design-system-escape: px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; font-semibold → className de <Text>/<Heading> */ "inline-flex items-center inline-micro bg-info/10 border border-info/25 text-info rounded px-1.5 py-0.5 text-[10px] font-semibold")}>
              <Camera className="w-2.5 h-2.5" />
              Foto
            </span>
          )}
          {formulario.geolocation_necessaria && (
            <span className={cn(/* design-system-escape: px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; font-semibold → className de <Text>/<Heading> */ "inline-flex items-center inline-micro bg-warning/10 border border-warning/25 text-warning rounded px-1.5 py-0.5 text-[10px] font-semibold")}>
              <MapPin className="w-2.5 h-2.5" />
              Geo
            </span>
          )}
          {!formulario.foto_necessaria && !formulario.geolocation_necessaria && (
            <span className="text-[10px] text-muted-foreground/70">Sem captura</span>
          )}
        </div>
        <span
          className={cn(
            /* design-system-escape: font-semibold → className de <Text>/<Heading>; px-2 padding direcional sem Inset equiv.; py-1 padding direcional sem Inset equiv. */ 'inline-flex items-center inline-snug rounded-lg text-[10px] font-semibold tracking-[0.04em] px-2 py-1 border',
            formulario.ativo
              ? 'bg-success/10 border-success/25 text-success'
              : 'bg-muted-foreground/10 border-muted-foreground/25 text-muted-foreground',
          )}
        >
          {formulario.ativo ? 'Ativo' : 'Inativo'}
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// ACTIONS — reusadas por row e card (compact)
// =============================================================================

function FormularioActions({
  formulario,
  onEdit,
  onEditSchema,
  onCopyLink,
  onDelete,
  canEdit,
  canDelete,
  compact = false,
}: {
  formulario: AssinaturaDigitalFormulario;
  onEdit?: (f: AssinaturaDigitalFormulario) => void;
  onEditSchema?: (f: AssinaturaDigitalFormulario) => void;
  onCopyLink?: (f: AssinaturaDigitalFormulario) => void;
  onDelete?: (f: AssinaturaDigitalFormulario) => void;
  canEdit: boolean;
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
          {onEditSchema && (
            <DropdownMenuItem onClick={() => onEditSchema(formulario)}>
              <Code2 className="w-3.5 h-3.5 mr-2" /> Schema
            </DropdownMenuItem>
          )}
          {canEdit && onEdit && (
            <DropdownMenuItem onClick={() => onEdit(formulario)}>
              <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
            </DropdownMenuItem>
          )}
          {onCopyLink && (
            <DropdownMenuItem onClick={() => onCopyLink(formulario)}>
              <Link2 className="w-3.5 h-3.5 mr-2" /> Copiar link
            </DropdownMenuItem>
          )}
          {canDelete && onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(formulario)} className="text-destructive">
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
      {onEditSchema && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label="Editar schema"
              onClick={(e) => { e.stopPropagation(); onEditSchema(formulario); }}
            >
              <Code2 className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Schema</TooltipContent>
        </Tooltip>
      )}
      {canEdit && onEdit && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label="Editar formulário"
              onClick={(e) => { e.stopPropagation(); onEdit(formulario); }}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Editar</TooltipContent>
        </Tooltip>
      )}
      {onCopyLink && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label="Copiar link público"
              onClick={(e) => { e.stopPropagation(); onCopyLink(formulario); }}
            >
              <Link2 className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copiar link</TooltipContent>
        </Tooltip>
      )}
      {canDelete && onDelete && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label="Deletar formulário"
              onClick={(e) => { e.stopPropagation(); onDelete(formulario); }}
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
      <ClipboardList className="w-10 h-10 text-muted-foreground/55 mb-4" />
      <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-body-sm font-medium text-muted-foreground/70")}>Nenhum formulário encontrado</p>
      <Text variant="caption" className="text-muted-foreground/55 mt-1">Tente ajustar os filtros ou criar um novo formulário</Text>
    </div>
  );
}

// =============================================================================
// MAIN
// =============================================================================

export function FormulariosGlassList({
  formularios,
  isLoading,
  mode = 'list',
  onEdit,
  onEditSchema,
  onCopyLink,
  onDelete,
  canEdit = false,
  canDelete = false,
}: FormulariosGlassListProps) {
  if (isLoading) return mode === 'cards' ? <CardsSkeleton /> : <ListSkeleton />;
  if (formularios.length === 0) return <EmptyState />;

  return (
    <TooltipProvider>
      {mode === 'cards' ? (
        <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 inline-medium")}>
          {formularios.map((f) => (
            <GlassCard
              key={f.id}
              formulario={f}
              onEdit={onEdit}
              onEditSchema={onEditSchema}
              onCopyLink={onCopyLink}
              onDelete={onDelete}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          ))}
        </div>
      ) : (
        <div className={cn("flex flex-col inline-tight")}>
          {formularios.map((f, i) => (
            <GlassRow
              key={f.id}
              formulario={f}
              onEdit={onEdit}
              onEditSchema={onEditSchema}
              onCopyLink={onCopyLink}
              onDelete={onDelete}
              canEdit={canEdit}
              canDelete={canDelete}
              isAlt={i % 2 === 1}
            />
          ))}
        </div>
      )}
    </TooltipProvider>
  );
}
