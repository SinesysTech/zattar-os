import * as React from 'react';
import { cn } from '@/lib/utils';
import { Typography } from '@/components/ui/typography';

/**
 * PageShell - Container principal para páginas.
 *
 * @ai-context Use este componente como wrapper de todas as páginas.
 * Ele fornece layout consistente com título, descrição opcional e área de ações.
 *
 * @example
 * <PageShell
 *   title="Processos"
 *   description="Gerencie seus processos judiciais"
 *   actions={<Button>Novo Processo</Button>}
 * >
 *   <ProcessosTable />
 * </PageShell>
 */
interface PageShellProps {
  title: string;
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
    <main className={cn('flex-1 space-y-4 p-4 sm:p-6 md:p-8 pt-6', className)}>
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex-1">
          <Typography.H2 className="text-2xl sm:text-3xl">
            {title}
          </Typography.H2>
          {description && (
            <Typography.Muted className="mt-1">{description}</Typography.Muted>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="space-y-4">{children}</div>
    </main>
  );
}
