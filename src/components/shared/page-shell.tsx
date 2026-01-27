'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * PageShell - Container principal para páginas.
 *
 * @ai-context Use este componente como wrapper de todas as páginas.
 * Ele fornece layout consistente com padding, tipografia e área de ações.
 *
 * Segue o Design System Zattar:
 * - Tipografia: font-heading para títulos, font-sans para descrições
 * - Espaçamento: gap-6 entre seções, gap-4 entre elementos
 * - Cores: text-foreground para títulos, text-muted-foreground para descrições
 *
 * @example
 * <PageShell
 *   title="Processos"
 *   description="Gerencie todos os processos do escritório"
 *   actions={<Button>Novo Processo</Button>}
 * >
 *   <ProcessosTable />
 * </PageShell>
 */
interface PageShellProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Renderiza um badge antes do título */
  badge?: React.ReactNode;
}

export function PageShell({
  title,
  description,
  actions,
  children,
  className,
  badge,
}: PageShellProps) {
  const hasHeader = title || description || actions || badge;

  return (
    <main className={cn('flex-1 space-y-6', className)}>
      {hasHeader && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            {badge && <div className="mb-2">{badge}</div>}
            {title && (
              <h1 className="text-2xl font-bold tracking-tight font-heading text-foreground sm:text-3xl">
                {title}
              </h1>
            )}
            {description && (
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl sm:text-base">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 shrink-0">{actions}</div>
          )}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </main>
  );
}
