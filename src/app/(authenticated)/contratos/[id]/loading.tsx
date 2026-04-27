import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { GlassPanel } from '@/components/shared/glass-panel';

export default function ContratoDetalhesLoading() {
  return (
    <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4")}>
      {/* Header skeleton */}
      <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "flex items-start justify-between gap-4")}>
        <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
          <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-4 w-32 ml-10" />
        </div>
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <Skeleton className="h-10 w-96" />

      {/* Content skeleton */}
      <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "grid gap-4 xl:grid-cols-3")}>
        {/* Left column */}
        <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4 xl:col-span-1")}>
          {/* Resumo card */}
          <GlassPanel className={cn(/* design-system-escape: p-6 → migrar para <Inset variant="dialog"> */ "p-6")}>
            <div className={cn(/* design-system-escape: space-y-8 → migrar para <Stack gap="section"> */ "space-y-8")}>
              <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "flex flex-col items-center space-y-4")}>
                <Skeleton className="size-20 rounded-full" />
                <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "text-center space-y-2")}>
                  <Skeleton className="h-6 w-48 mx-auto" />
                  <Skeleton className="h-6 w-24 mx-auto" />
                </div>
              </div>
              <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "grid grid-cols-3 gap-4")}>
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
              <div className={cn(/* design-system-escape: space-y-3 sem token DS */ "space-y-3")}>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </GlassPanel>

          {/* Progress card */}
          <GlassPanel className={cn(/* design-system-escape: p-6 → migrar para <Inset variant="dialog"> */ "p-6")}>
            <Skeleton className="h-5 w-40 mb-4" />
            <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4")}>
              <Skeleton className="h-2 w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </GlassPanel>

          {/* Tags card */}
          <GlassPanel className={cn(/* design-system-escape: p-6 → migrar para <Inset variant="dialog"> */ "p-6")}>
            <Skeleton className="h-5 w-32 mb-4" />
            <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex flex-wrap gap-2")}>
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-28" />
            </div>
          </GlassPanel>
        </div>

        {/* Right column */}
        <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4 xl:col-span-2")}>
          {/* Partes card */}
          <GlassPanel className={cn(/* design-system-escape: p-6 → migrar para <Inset variant="dialog"> */ "p-6")}>
            <Skeleton className="h-5 w-40 mb-4" />
            <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4")}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "flex items-center gap-4")}>
                  <Skeleton className="size-10 rounded-full" />
                  <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2 flex-1")}>
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          </GlassPanel>

          {/* Processos card */}
          <GlassPanel className={cn(/* design-system-escape: p-6 → migrar para <Inset variant="dialog"> */ "p-6")}>
            <Skeleton className="h-5 w-48 mb-4" />
            <div className={cn(/* design-system-escape: space-y-3 sem token DS */ "space-y-3")}>
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
