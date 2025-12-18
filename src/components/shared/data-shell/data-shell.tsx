import * as React from 'react';
import { cn } from '@/lib/utils';

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
 * =============================================================================
 * DataShell - PADRÃO OBRIGATÓRIO para Visualização de Dados no Sinesys
 * =============================================================================
 *
 * IMPORTANTE: Este é o padrão oficial para todas as tabelas/listas de dados.
 * O DataTable DEVE ser usado dentro de um DataShell.
 *
 * ESTRUTURA:
 * ---------
 * Container visual para superfícies de dados (listas/tabelas) com narrativa colada:
 * - header (toolbar/filtros)
 * - conteúdo (área scrollável com DataTable)
 * - footer (paginação/summary)
 *
 * PADRÃO DE USO OBRIGATÓRIO:
 * -------------------------
 * ```tsx
 * <DataShell
 *   header={<DataTableToolbar table={table} />}
 *   footer={<DataPagination {...paginationProps} />}
 * >
 *   <DataTable
 *     columns={columns}
 *     data={data}
 *     hideTableBorder={true} // Border é gerenciado pelo DataShell
 *   />
 * </DataShell>
 * ```
 *
 * NUNCA use DataTable diretamente sem DataShell!
 *
 * ACESSIBILIDADE:
 * --------------
 * - role="region" com aria-label para identificar a seção
 * - data-slot para hooks de teste/CSS
 *
 * =============================================================================
 */
export function DataShell({
  header,
  footer,
  children,
  className,
  ariaLabel = 'Seção de dados',
  // actionButton is now passed directly to DataTableToolbar, not via cloneElement
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  actionButton: _actionButton,
  ...props
}: DataShellProps) {
  return (
    <div data-slot="data-shell-wrapper" className="flex flex-col gap-4">
      {/* Botão de ação primária - agora passado para o header (Toolbar) */}

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
