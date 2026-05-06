import { cn } from '@/lib/utils';
import { Suspense } from 'react';
import { ExpedientesContent } from '@/app/(authenticated)/expedientes';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

/**
 * Fallback de loading para o Suspense
 */
function ExpedientesLoading() {
  return (
    <div className={cn("flex flex-col stack-default-plus")}>
      {/* Header skeleton */}
      <div className={cn("flex items-end justify-between inline-default")}>
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56 mt-1.5" />
        </div>
        <div className={cn("flex inline-tight")}>
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
      </div>

      {/* PulseStrip skeleton */}
      <div className={cn("grid grid-cols-2 lg:grid-cols-4 inline-medium")}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>

      {/* Controls skeleton */}
      <div className={cn("flex items-center inline-medium")}>
        <Skeleton className="h-9 w-72 rounded-xl" />
        <div className="flex-1" />
        <Skeleton className="h-9 w-56 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      {/* Content skeleton */}
      <div className={cn("flex flex-col stack-medium")}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

/**
 * Página raiz de Expedientes
 * Renderiza visualização unificada com alternância entre semana, mês, ano e lista
 */
export default function ExpedientesPage() {
  return (
    <Suspense fallback={<ExpedientesLoading />}>
      <ExpedientesContent visualizacao="quadro" />
    </Suspense>
  );
}
