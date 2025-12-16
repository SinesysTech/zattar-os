'use client';

/**
 * TemporalViewShell - Container unificado para visualizações temporais
 *
 * Combina ViewSwitcher, DateNavigation e área de filtros em um layout
 * consistente. Usado como base para módulos com calendário (audiências,
 * expedientes, etc).
 *
 * @example
 * ```tsx
 * <TemporalViewShell
 *   viewSwitcher={<ViewSwitcher value={view} onValueChange={setView} />}
 *   dateNavigation={<DateNavigation {...navigationProps} />}
 *   filters={<CalendarFilters filters={filters} onChange={setFilters} />}
 * >
 *   {view === 'semana' && <WeekView />}
 *   {view === 'lista' && <ListView />}
 * </TemporalViewShell>
 * ```
 */

import * as React from 'react';

import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

// =============================================================================
// TIPOS
// =============================================================================

export interface TemporalViewShellProps {
  /** Componente ViewSwitcher para alternar visualizações */
  viewSwitcher: React.ReactNode;
  /** Componente DateNavigation (opcional para lista) */
  dateNavigation?: React.ReactNode;
  /** Componente de busca */
  search?: React.ReactNode;
  /** Componente de filtros */
  filters?: React.ReactNode;
  /** Botões extras (refresh, settings, etc) */
  extraActions?: React.ReactNode;
  /** Conteúdo principal */
  children: React.ReactNode;
  /** Classes CSS adicionais para o container */
  className?: string;
  /** Classes CSS para o header */
  headerClassName?: string;
  /** Classes CSS para o conteúdo */
  contentClassName?: string;
  /** Variante de layout */
  variant?: 'default' | 'compact';
  /** Mostrar separadores entre seções do header */
  showSeparators?: boolean;
}

// =============================================================================
// COMPONENTE
// =============================================================================

export function TemporalViewShell({
  viewSwitcher,
  dateNavigation,
  search,
  filters,
  extraActions,
  children,
  className,
  headerClassName,
  contentClassName,
  variant = 'default',
  showSeparators = true,
}: TemporalViewShellProps) {
  const hasRightSection = dateNavigation || search || filters || extraActions;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <header
        className={cn(
          'flex flex-col gap-3 border-b bg-background',
          variant === 'default' && 'px-4 py-3',
          variant === 'compact' && 'px-3 py-2',
          headerClassName
        )}
      >
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between gap-4">
          {/* Left: View Switcher */}
          <div className="flex items-center">{viewSwitcher}</div>

          {/* Right: Navigation + Search + Filters */}
          {hasRightSection && (
            <div className="flex items-center gap-3">
              {dateNavigation && (
                <>
                  {dateNavigation}
                  {showSeparators && (search || filters || extraActions) && (
                    <Separator orientation="vertical" className="h-6" />
                  )}
                </>
              )}

              {search && (
                <>
                  {search}
                  {showSeparators && (filters || extraActions) && (
                    <Separator orientation="vertical" className="h-6" />
                  )}
                </>
              )}

              {filters}

              {extraActions && (
                <>
                  {showSeparators && <Separator orientation="vertical" className="h-6" />}
                  {extraActions}
                </>
              )}
            </div>
          )}
        </div>

        {/* Mobile Layout */}
        <div className="flex md:hidden flex-col gap-2">
          {/* Row 1: View Switcher */}
          <div className="flex justify-center">{viewSwitcher}</div>

          {/* Row 2: Navigation + Filters */}
          {hasRightSection && (
            <div className="flex items-center justify-between gap-2">
              {dateNavigation}
              <div className="flex items-center gap-2">
                {search}
                {filters}
                {extraActions}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main
        className={cn(
          'flex-1 overflow-hidden',
          contentClassName
        )}
      >
        {children}
      </main>
    </div>
  );
}

// =============================================================================
// COMPONENTE: TemporalViewContent (wrapper para conteúdo com scroll)
// =============================================================================

export interface TemporalViewContentProps {
  /** Conteúdo */
  children: React.ReactNode;
  /** Classes CSS adicionais */
  className?: string;
  /** Padding interno */
  padding?: boolean;
}

export function TemporalViewContent({
  children,
  className,
  padding = true,
}: TemporalViewContentProps) {
  return (
    <div
      className={cn(
        'h-full overflow-auto',
        padding && 'p-4',
        className
      )}
    >
      {children}
    </div>
  );
}

// =============================================================================
// COMPONENTE: TemporalViewHeader (header customizado dentro do conteúdo)
// =============================================================================

export interface TemporalViewHeaderProps {
  /** Título */
  title: string;
  /** Descrição ou subtítulo */
  description?: string;
  /** Elemento à direita (badges, botões, etc) */
  rightElement?: React.ReactNode;
  /** Classes CSS adicionais */
  className?: string;
}

export function TemporalViewHeader({
  title,
  description,
  rightElement,
  className,
}: TemporalViewHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 bg-muted/10 border-b',
        className
      )}
    >
      <div>
        <h3 className="font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {rightElement && <div className="flex items-center gap-2">{rightElement}</div>}
    </div>
  );
}

// =============================================================================
// COMPONENTE: TemporalViewLoading
// =============================================================================

export interface TemporalViewLoadingProps {
  /** Mensagem de loading */
  message?: string;
  /** Classes CSS adicionais */
  className?: string;
}

export function TemporalViewLoading({
  message = 'Carregando...',
  className,
}: TemporalViewLoadingProps) {
  return (
    <div
      className={cn(
        'flex flex-1 items-center justify-center h-full',
        className
      )}
    >
      <div className="text-muted-foreground">{message}</div>
    </div>
  );
}

// =============================================================================
// COMPONENTE: TemporalViewError
// =============================================================================

export interface TemporalViewErrorProps {
  /** Mensagem de erro */
  message: string;
  /** Callback para retry */
  onRetry?: () => void;
  /** Classes CSS adicionais */
  className?: string;
}

export function TemporalViewError({
  message,
  onRetry,
  className,
}: TemporalViewErrorProps) {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col items-center justify-center h-full gap-4',
        className
      )}
    >
      <div className="text-destructive">{message}</div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-sm text-primary hover:underline"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}
