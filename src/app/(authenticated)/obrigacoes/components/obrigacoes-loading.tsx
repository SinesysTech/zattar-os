import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type ObrigacoesView = 'semana' | 'mes' | 'ano' | 'lista';

function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-border/30 bg-card/30 overflow-hidden">
      {/* Header */}
      <div className={cn("flex items-center inline-default px-4 py-3 border-b border-border/30 bg-muted/20")}>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-20" />
        <div className="flex-1" />
        <Skeleton className="h-3 w-16" />
      </div>
      {/* Rows */}
      <div className="divide-y divide-border/20">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className={cn("flex items-center inline-default px-4 py-3")}>
            <Skeleton className="size-8 rounded-lg" />
            <div className={cn("flex-1 stack-tight min-w-0")}>
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-2.5 w-1/3" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="size-8 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthCalendarSkeleton() {
  return (
    <div className={cn("rounded-xl border border-border/30 bg-card/30 inset-card-compact")}>
      {/* Weekday headers */}
      <div className={cn("grid grid-cols-7 inline-tight mb-3")}>
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-full" />
        ))}
      </div>
      {/* Day cells */}
      <div className={cn("grid grid-cols-7 inline-tight")}>
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function YearGridSkeleton() {
  return (
    <div className={cn("grid inline-default sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4")}>
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className={cn("rounded-xl border border-border/30 bg-card/30 inset-card-compact stack-medium")}
        >
          <Skeleton className="h-4 w-24" />
          <div className={cn("grid grid-cols-7 inline-snug")}>
            {Array.from({ length: 35 }).map((_, j) => (
              <Skeleton key={j} className="aspect-square rounded-sm" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ObrigacoesLoading({ view = 'lista' }: { view?: ObrigacoesView }) {
  return (
    <div className={cn("stack-loose")}>
      {/* Header: título + botão "Nova" */}
      <div className={cn("flex items-center justify-between inline-default")}>
        <div className={cn("stack-tight")}>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-3.5 w-72" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Pulse Strip — 4 KPIs */}
      <div className={cn("grid inline-medium grid-cols-2 lg:grid-cols-4")}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn("rounded-xl border border-border/30 bg-card/40 inset-card-compact stack-medium")}
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-2.5 w-24" />
          </div>
        ))}
      </div>

      {/* Filter bar + search + view toggle */}
      <div className={cn("flex items-center inline-medium flex-wrap")}>
        <Skeleton className="h-9 w-28 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
        <div className="flex-1 min-w-40" />
        <Skeleton className="h-9 flex-1 min-w-48 max-w-80 rounded-lg" />
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>

      {/* Main content conforme view */}
      {view === 'mes' ? (
        <MonthCalendarSkeleton />
      ) : view === 'ano' ? (
        <YearGridSkeleton />
      ) : (
        <TableSkeleton rows={view === 'semana' ? 6 : 10} />
      )}
    </div>
  );
}
