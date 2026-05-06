/**
 * Skeleton loader para lista de documentos
 */

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function DocumentListSkeleton() {
  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar skeleton */}
      <div className={cn("w-64 border-r bg-muted/10 inset-card-compact")}>
        <Skeleton className="mb-4 h-6 w-24" />
        <div className={cn("flex flex-col stack-tight")}>
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex flex-1 flex-col">
        {/* Toolbar skeleton */}
        <div className={cn("border-b inset-card-compact")}>
          <div className={cn("flex items-center inline-default")}>
            <Skeleton className="h-10 flex-1 max-w-sm" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>

        {/* List skeleton */}
        <div className={cn("flex flex-col flex-1 stack-default inset-card-compact")}>
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
