import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { GlassPanel } from '@/components/shared/glass-panel';

export default function ContratoDetalhesLoading() {
  return (
    <div className={cn("stack-default")}>
      {/* Header skeleton */}
      <div className={cn("flex items-start justify-between inline-default")}>
        <div className={cn("stack-tight")}>
          <div className={cn("flex items-center inline-tight")}>
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-4 w-32 ml-10" />
        </div>
        <div className={cn("flex items-center inline-tight")}>
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <Skeleton className="h-10 w-96" />

      {/* Content skeleton */}
      <div className={cn("grid inline-default xl:grid-cols-3")}>
        {/* Left column */}
        <div className={cn("stack-default xl:col-span-1")}>
          {/* Resumo card */}
          <GlassPanel className={cn("inset-dialog")}>
            <div className={cn("stack-section")}>
              <div className={cn("flex flex-col items-center stack-default")}>
                <Skeleton className="size-20 rounded-full" />
                <div className={cn("text-center stack-tight")}>
                  <Skeleton className="h-6 w-48 mx-auto" />
                  <Skeleton className="h-6 w-24 mx-auto" />
                </div>
              </div>
              <div className={cn("grid grid-cols-3 inline-default")}>
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
          <GlassPanel className={cn("inset-dialog")}>
            <Skeleton className="h-5 w-40 mb-4" />
            <div className={cn("stack-default")}>
              <Skeleton className="h-2 w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </GlassPanel>

          {/* Tags card */}
          <GlassPanel className={cn("inset-dialog")}>
            <Skeleton className="h-5 w-32 mb-4" />
            <div className={cn("flex flex-wrap inline-tight")}>
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-28" />
            </div>
          </GlassPanel>
        </div>

        {/* Right column */}
        <div className={cn("stack-default xl:col-span-2")}>
          {/* Partes card */}
          <GlassPanel className={cn("inset-dialog")}>
            <Skeleton className="h-5 w-40 mb-4" />
            <div className={cn("stack-default")}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={cn("flex items-center inline-default")}>
                  <Skeleton className="size-10 rounded-full" />
                  <div className={cn("stack-tight flex-1")}>
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          </GlassPanel>

          {/* Processos card */}
          <GlassPanel className={cn("inset-dialog")}>
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
