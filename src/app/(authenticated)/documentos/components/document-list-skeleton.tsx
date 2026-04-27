/**
 * Skeleton loader para lista de documentos
 */

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function DocumentListSkeleton() {
  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar skeleton */}
      <div className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ "w-64 border-r bg-muted/10 p-4")}>
        <Skeleton className="mb-4 h-6 w-24" />
        <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex flex-1 flex-col">
        {/* Toolbar skeleton */}
        <div className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ "border-b p-4")}>
          <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "flex items-center gap-4")}>
            <Skeleton className="h-10 flex-1 max-w-sm" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>

        {/* List skeleton */}
        <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default">; p-4 → migrar para <Inset variant="card-compact"> */ "flex-1 space-y-4 p-4")}>
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  );
}
