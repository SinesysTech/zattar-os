import * as React from 'react';
import { cn } from '@/lib/utils';

interface DataShellProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * DataShell
 *
 * Container visual para superfícies de dados (listas/tabelas) com narrativa colada:
 * - header (toolbar/filtros)
 * - conteúdo (área scrollável)
 * - footer (paginação/summary)
 *
 * Importante: header/footer devem trazer seus próprios estilos (bordas/arredondamentos)
 * quando necessário, para evitar duplicação (ex.: `variant="integrated"`).
 */
export function DataShell({
  header,
  footer,
  children,
  className,
  ...props
}: DataShellProps) {
  return (
    <div
      className={cn(
        'flex w-full flex-col rounded-lg border border-border bg-card shadow-sm',
        className
      )}
      {...props}
    >
      {header && <div className="flex-none p-0">{header}</div>}

      <div className="relative flex-1 min-h-0 w-full overflow-hidden">
        <div className="h-full w-full overflow-auto">{children}</div>
      </div>

      {footer && <div className="flex-none p-0">{footer}</div>}
    </div>
  );
}


