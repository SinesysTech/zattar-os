import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

/**
 * Skeleton que espelha a estrutura do FinanceiroDashboard.
 * Mantém layout estável durante carregamento (evita content jumping).
 */
export function DashboardSkeleton() {
  return (
    <div className={cn("stack-loose")}>
      {/* Tier 1: KPI Strip */}
      <div className={cn("grid grid-cols-2 inline-default md:grid-cols-3 xl:grid-cols-6")}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact">; sm:p-6 sem equivalente DS; space-y-3 sem token DS */ "rounded-xl border bg-card p-4 sm:p-6 space-y-3")}>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Tier 2: Charts row */}
      <div className={cn("grid inline-default lg:grid-cols-3")}>
        <Card className="lg:col-span-2">
          <CardHeader className={cn(/* design-system-escape: pb-2 padding direcional sem Inset equiv. */ "pb-2")}>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-72 lg:h-80 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className={cn(/* design-system-escape: pb-2 padding direcional sem Inset equiv. */ "pb-2")}>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className={cn("stack-default")}>
            <Skeleton className="h-40 w-40 rounded-full mx-auto" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Tier 3: Second charts row */}
      <div className={cn("grid inline-default lg:grid-cols-3")}>
        <Card className="lg:col-span-2">
          <CardHeader className={cn(/* design-system-escape: pb-2 padding direcional sem Inset equiv. */ "pb-2")}>
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-72 lg:h-80 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className={cn(/* design-system-escape: pb-2 padding direcional sem Inset equiv. */ "pb-2")}>
            <Skeleton className="h-5 w-44" />
          </CardHeader>
          <CardContent className={cn(/* design-system-escape: space-y-3 sem token DS */ "space-y-3")}>
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-2.5 w-full rounded-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>

      {/* Tier 4: Bottom cards */}
      <div className={cn("grid inline-default md:grid-cols-2 lg:grid-cols-3")}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className={cn(/* design-system-escape: pb-2 padding direcional sem Inset equiv. */ "pb-2")}>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className={cn(/* design-system-escape: space-y-3 sem token DS */ "space-y-3")}>
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className={cn(/* design-system-escape: gap-3 gap sem token DS; p-3 → usar <Inset> */ "flex gap-3 rounded-lg border p-3")}>
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <div className={cn(/* design-system-escape: space-y-1.5 sem token DS */ "space-y-1.5 flex-1")}>
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
