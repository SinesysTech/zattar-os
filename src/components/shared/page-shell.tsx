'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * PageShell - Container principal para páginas.
 *
 * @ai-context Use este componente como wrapper de todas as páginas.
 * Ele fornece layout consistente com padding e área de ações.
 *
 * @example
 * <PageShell actions={<Button>Novo</Button>}>
 *   <ProcessosTable />
 * </PageShell>
 */
interface PageShellProps {
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PageShell({
  actions,
  children,
  className,
}: PageShellProps) {
  return (
    <main className={cn('flex-1 space-y-4 p-4 sm:p-6 md:p-8 pt-6', className)}>
      {actions && (
        <div className="flex items-center justify-end gap-2 mb-6">
          {actions}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </main>
  );
}
