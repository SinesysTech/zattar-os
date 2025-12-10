import * as React from "react";
import { cn } from "@/lib/utils";

interface DataSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * DataSurface principal component for lists (Toolbar + Table + Pagination)
 * Enforces the "glued" visual structure:
 * - Header (Toolbar): rounded-t, border-b
 * - Content (Table): no border vertical
 * - Footer (Pagination): rounded-b, border-t
 */
export function DataSurface({
  header,
  footer,
  children,
  className,
  ...props
}: DataSurfaceProps) {
  return (
    <div
      className={cn(
        "flex flex-col w-full rounded-lg border border-border bg-card shadow-sm",
        className
      )}
      {...props}
    >
      {/* 1. Header Area (Toolbar) */}
      {header && <div className="flex-none p-0 z-10">{header}</div>}

      {/* 2. Scrollable Content Area */}
      <div className="flex-1 min-h-0 relative w-full overflow-hidden">
        <div className="h-full w-full overflow-auto">{children}</div>
      </div>

      {/* 3. Footer Area (Pagination/Summary) */}
      {footer && (
        <div className="flex-none border-t border-border bg-card p-0 rounded-b-lg">
          {footer}
        </div>
      )}
    </div>
  );
}
