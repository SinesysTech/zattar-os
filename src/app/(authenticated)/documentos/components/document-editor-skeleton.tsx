/**
 * Skeleton loader para o editor de documentos
 */

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function DocumentEditorSkeleton() {
  return (
    <div className="flex h-full flex-col">
      {/* Header skeleton */}
      <div className={cn("border-b inset-card-compact")}>
        <div className={cn("flex items-center justify-between inline-default")}>
          <div className={cn("flex items-center inline-tight flex-1")}>
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 flex-1 max-w-md" />
          </div>
          <div className={cn("flex items-center inline-tight")}>
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
      </div>

      {/* Editor skeleton */}
      <div className={cn(/* design-system-escape: p-8 → usar <Inset> */ "flex-1 overflow-auto p-8")}>
        <div className={cn("mx-auto max-w-4xl stack-default")}>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-5/6" />
          <div className={cn("py-4")} />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-4/5" />
        </div>
      </div>
    </div>
  );
}
