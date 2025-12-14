import * as React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface DataShellActionButton {
  /** Label do botão */
  label: string;
  /** Ícone customizado (default: Plus) */
  icon?: React.ReactNode;
  /** Callback ao clicar */
  onClick: () => void;
  /** Tooltip opcional (default: usa label) */
  tooltip?: string;
}

export interface DataShellProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Content for the header slot (toolbar/filters) */
  header?: React.ReactNode;
  /** Content for the footer slot (pagination/summary) */
  footer?: React.ReactNode;
  /** Main content (table/list) */
  children: React.ReactNode;
  /** Accessible label for the data region */
  ariaLabel?: string;
  /** Botão de ação primária (renderizado fora da shell, canto superior direito) */
  actionButton?: DataShellActionButton;
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
  actionButton,
  ...props
}: DataShellProps) {
  return (
    <div data-slot="data-shell-wrapper" className="flex flex-col gap-4">
      {/* Botão de ação primária - fora da shell, canto superior direito */}
      {actionButton && (
        <div className="flex justify-end px-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={actionButton.onClick} size="sm" className="h-10">
                {actionButton.icon ?? <Plus className="mr-2 h-4 w-4" />}
                {!actionButton.icon && actionButton.label}
                {actionButton.icon && (
                  <span className="ml-2">{actionButton.label}</span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {actionButton.tooltip ?? actionButton.label}
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Shell principal */}
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
    </div>
  );
}
