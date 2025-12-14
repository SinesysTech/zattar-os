import * as React from 'react';
import { cn } from '@/lib/utils';

export interface DataShellProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Content for the header slot (toolbar/filters) */
  header?: React.ReactNode;
  /** Content for the footer slot (pagination/summary) */
  footer?: React.ReactNode;
  /** Main content (table/list) */
  children: React.ReactNode;
  /** Accessible label for the data region */
  ariaLabel?: string;
}

/**
 * DataShell
 *
 * Container visual para superfícies de dados (listas/tabelas) com narrativa colada:
 * - header (toolbar/filtros)
 * - conteúdo (área scrollável)
 * - footer (paginação/summary)
 *
 * Acessibilidade:
 * - role="region" com aria-label para identificar a seção
 * - data-slot para hooks de teste/CSS
 *
 * @example
 * ```tsx
 * <DataShell
 *   header={<DataTableToolbar table={table} />}
 *   footer={<DataPagination {...paginationProps} />}
 * >
 *   <DataTable columns={columns} data={data} />
 * </DataShell>
 * ```
 */
export function DataShell({
  header,
  footer,
  children,
  className,
  ariaLabel = 'Seção de dados',
  ...props
}: DataShellProps) {
  return (
    <div
      role="region"
      aria-label={ariaLabel}
      data-slot="data-shell"
      className={cn(
        'flex w-full flex-col rounded-lg border border-border bg-card shadow-sm',
        className
      )}
      {...props}
    >
      {header && (
        <div data-slot="data-shell-header" className="flex-none">
          {header}
        </div>
      )}

      <div
        data-slot="data-shell-content"
        className="relative min-h-0 w-full flex-1 overflow-hidden"
      >
        <div className="h-full w-full overflow-auto">{children}</div>
      </div>

      {footer && (
        <div data-slot="data-shell-footer" className="flex-none">
          {footer}
        </div>
      )}
    </div>
  );
}
