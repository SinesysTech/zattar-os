import * as React from 'react';
import { cn } from '@/lib/utils';

interface DataTableShellProps {
  toolbar?: React.ReactNode;
  children: React.ReactNode; // The table component itself
  pagination?: React.ReactNode;
  className?: string;
}

export function DataTableShell({
  toolbar,
  children,
  pagination,
  className,
}: DataTableShellProps) {
  return (
    <div
      className={cn(
        'flex flex-col w-full rounded-lg border border-border bg-card shadow-sm',
        className
      )}
    >
      {toolbar && (
        <div className="p-0">
          {/* The toolbar should have its own styling, specified to have rounded-t-lg and border-b */}
          {toolbar}
        </div>
      )}
      <div className="relative w-full overflow-auto">
        {/* The table will be passed as children */}
        {children}
      </div>
      {pagination && (
        <div className="p-0">
          {/* The pagination component should have its own styling, specified to have rounded-b-lg and border-t */}
          {pagination}
        </div>
      )}
    </div>
  );
}
