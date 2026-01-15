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
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PageShell({
  title,
  description,
  actions,
  children,
  className,
}: PageShellProps) {
  return (
    <main className={cn('flex-1 space-y-6', className)}>
      {(title || description || actions) && (
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </main>
  );
}
