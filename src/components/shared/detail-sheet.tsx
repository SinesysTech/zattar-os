'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// =============================================================================
// CONTEXT
// =============================================================================

interface DetailSheetContextValue {
  loading: boolean;
  error: string | null;
}

const DetailSheetContext = React.createContext<DetailSheetContextValue>({
  loading: false,
  error: null,
});

function useDetailSheet() {
  return React.useContext(DetailSheetContext);
}

// =============================================================================
// ROOT — DetailSheet
// =============================================================================

interface DetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  className?: string;
  side?: 'left' | 'right';
}

function DetailSheet({
  open,
  onOpenChange,
  children,
  loading = false,
  error = null,
  className,
  side = 'right',
}: DetailSheetProps) {
  const ctx = React.useMemo(
    () => ({ loading, error }),
    [loading, error]
  );

  return (
    <DetailSheetContext.Provider value={ctx}>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side={side}
          className={cn(
            'w-full sm:w-135 md:w-155 flex flex-col h-full bg-background',
            className
          )}
        >
          {loading ? (
            <DetailSheetSkeleton />
          ) : error ? (
            <DetailSheetError message={error} onClose={() => onOpenChange(false)} />
          ) : (
            children
          )}
        </SheetContent>
      </Sheet>
    </DetailSheetContext.Provider>
  );
}

// =============================================================================
// HEADER
// =============================================================================

interface DetailSheetHeaderProps {
  children: React.ReactNode;
  className?: string;
}

function DetailSheetHeader({ children, className }: DetailSheetHeaderProps) {
  return (
    <SheetHeader className={cn('pb-4 border-b border-border/20', className)}>
      {children}
    </SheetHeader>
  );
}

// =============================================================================
// TITLE
// =============================================================================

interface DetailSheetTitleProps {
  children: React.ReactNode;
  className?: string;
  badge?: React.ReactNode;
}

function DetailSheetTitle({ children, className, badge }: DetailSheetTitleProps) {
  if (badge) {
    return (
      <div className="flex items-start justify-between gap-3">
        <SheetTitle className={cn('text-base font-heading font-semibold tracking-tight flex-1 min-w-0', className)}>
          {children}
        </SheetTitle>
        <div className="shrink-0">{badge}</div>
      </div>
    );
  }

  return (
    <SheetTitle className={cn('text-base font-heading font-semibold tracking-tight', className)}>
      {children}
    </SheetTitle>
  );
}

// =============================================================================
// DESCRIPTION
// =============================================================================

interface DetailSheetDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

function DetailSheetDescription({ children, className }: DetailSheetDescriptionProps) {
  return (
    <SheetDescription className={cn('flex items-center gap-1.5 mt-1 flex-wrap text-xs text-muted-foreground/65', className)}>
      {children}
    </SheetDescription>
  );
}

// =============================================================================
// ACTIONS
// =============================================================================

interface DetailSheetActionsProps {
  children: React.ReactNode;
  className?: string;
}

function DetailSheetActions({ children, className }: DetailSheetActionsProps) {
  return (
    <div className={cn('flex items-center gap-1.5 mt-2', className)}>
      {children}
    </div>
  );
}

// =============================================================================
// CONTENT (scrollable area)
// =============================================================================

interface DetailSheetContentProps {
  children: React.ReactNode;
  className?: string;
}

function DetailSheetContent({ children, className }: DetailSheetContentProps) {
  return (
    <div className={cn('flex-1 overflow-y-auto p-4 space-y-4', className)}>
      {children}
    </div>
  );
}

// =============================================================================
// SECTION — card com borda sutil
// =============================================================================

interface DetailSheetSectionProps {
  icon?: React.ReactNode;
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

function DetailSheetSection({
  icon,
  title,
  children,
  action,
  className,
}: DetailSheetSectionProps) {
  return (
    <div className={cn('rounded-xl border border-border/30 p-4', className)}>
      <div className="flex items-center justify-between mb-2.5">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
          {icon}
          {title}
        </h4>
        {action}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

// =============================================================================
// INFO ROW
// =============================================================================

interface DetailSheetInfoRowProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

function DetailSheetInfoRow({ label, children, className }: DetailSheetInfoRowProps) {
  return (
    <div className={cn('flex items-start justify-between gap-2', className)}>
      <span className="text-xs text-muted-foreground/65 shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{children}</span>
    </div>
  );
}

// =============================================================================
// META GRID
// =============================================================================

interface DetailSheetMetaGridProps {
  children: React.ReactNode;
  className?: string;
}

function DetailSheetMetaGrid({ children, className }: DetailSheetMetaGridProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3', className)}>
      {children}
    </div>
  );
}

// =============================================================================
// META ITEM
// =============================================================================

interface DetailSheetMetaItemProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

function DetailSheetMetaItem({ label, children, className }: DetailSheetMetaItemProps) {
  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <span className="text-[10px] text-muted-foreground/65 uppercase tracking-wider">
        {label}
      </span>
      <div className="flex items-center gap-1.5 text-sm font-medium">
        {children}
      </div>
    </div>
  );
}

// =============================================================================
// SEPARATOR
// =============================================================================

interface DetailSheetSeparatorProps {
  className?: string;
}

function DetailSheetSeparator({ className }: DetailSheetSeparatorProps) {
  return <div className={cn('h-px bg-border/10 my-1.5', className)} />;
}

// =============================================================================
// AUDIT
// =============================================================================

interface DetailSheetAuditProps {
  createdAt: string;
  updatedAt?: string;
  className?: string;
}

function DetailSheetAudit({ createdAt, updatedAt, className }: DetailSheetAuditProps) {
  const formatDate = (dateStr: string) => {
    try {
      const date = typeof dateStr === 'string' && dateStr.includes('T')
        ? parseISO(dateStr)
        : new Date(dateStr);
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={cn('flex items-center gap-3 text-[10px] text-muted-foreground/50 pt-2', className)}>
      <span>Criado: {formatDate(createdAt)}</span>
      {updatedAt && (
        <>
          <span className="size-0.5 rounded-full bg-muted-foreground/20" />
          <span>Atualizado: {formatDate(updatedAt)}</span>
        </>
      )}
    </div>
  );
}

// =============================================================================
// FOOTER
// =============================================================================

interface DetailSheetFooterProps {
  children: React.ReactNode;
  className?: string;
}

function DetailSheetFooter({ children, className }: DetailSheetFooterProps) {
  return (
    <SheetFooter className={cn('border-t border-border/20 pt-4', className)}>
      {children}
    </SheetFooter>
  );
}

// =============================================================================
// SKELETON
// =============================================================================

function DetailSheetSkeleton() {
  return (
    <>
      <SheetHeader className="pb-4 border-b border-border/20">
        <SheetTitle className="sr-only">Carregando</SheetTitle>
        <div className="flex items-start gap-3">
          <Skeleton className="size-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
      </SheetHeader>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    </>
  );
}

// =============================================================================
// ERROR
// =============================================================================

interface DetailSheetErrorProps {
  message: string;
  onClose: () => void;
}

function DetailSheetError({ message, onClose }: DetailSheetErrorProps) {
  return (
    <>
      <SheetHeader className="pb-4 border-b border-border/20">
        <SheetTitle className="sr-only">Erro</SheetTitle>
      </SheetHeader>
      <div className="flex-1 flex items-center justify-center p-4">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AlertTriangle className="text-destructive" />
            </EmptyMedia>
            <EmptyTitle>Erro ao carregar</EmptyTitle>
            <EmptyDescription>{message}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
      <SheetFooter className="border-t border-border/20 pt-4">
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
      </SheetFooter>
    </>
  );
}

// =============================================================================
// EMPTY
// =============================================================================

interface DetailSheetEmptyProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

function DetailSheetEmpty({
  title = 'Não encontrado',
  description = 'Os detalhes não puderam ser carregados.',
  icon,
}: DetailSheetEmptyProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            {icon || <AlertTriangle />}
          </EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  DetailSheet,
  DetailSheetHeader,
  DetailSheetTitle,
  DetailSheetDescription,
  DetailSheetActions,
  DetailSheetContent,
  DetailSheetSection,
  DetailSheetInfoRow,
  DetailSheetMetaGrid,
  DetailSheetMetaItem,
  DetailSheetSeparator,
  DetailSheetAudit,
  DetailSheetFooter,
  DetailSheetEmpty,
  useDetailSheet,
};

export type {
  DetailSheetProps,
  DetailSheetHeaderProps,
  DetailSheetTitleProps,
  DetailSheetDescriptionProps,
  DetailSheetActionsProps,
  DetailSheetContentProps,
  DetailSheetSectionProps,
  DetailSheetInfoRowProps,
  DetailSheetMetaGridProps,
  DetailSheetMetaItemProps,
  DetailSheetSeparatorProps,
  DetailSheetAuditProps,
  DetailSheetFooterProps,
  DetailSheetEmptyProps,
};
