import { Skeleton } from '@/components/ui/skeleton';

export function TableSkeleton() {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="rounded-xl border">
        <div className="h-12 w-full rounded-t-xl bg-muted/50" />
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 w-full p-4">
              <Skeleton className="h-full w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="flex flex-col gap-6 rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-6" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
    </div>
  );
}
