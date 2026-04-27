/**
 * Skeleton loader para o editor de documentos
 */

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function DocumentEditorSkeleton() {
  return (
    <div className="flex h-full flex-col">
      {/* Header skeleton */}
      <div className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ "border-b p-4")}>
        <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "flex items-center justify-between gap-4")}>
          <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2 flex-1")}>
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 flex-1 max-w-md" />
          </div>
          <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
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
        <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "mx-auto max-w-4xl space-y-4")}>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-5/6" />
          <div className={cn(/* design-system-escape: py-4 padding direcional sem Inset equiv. */ "py-4")} />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-4/5" />
        </div>
      </div>
    </div>
  );
}
