import { Suspense } from 'react';
import { ExpedientesContent } from '@/app/(authenticated)/expedientes';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

/**
 * Fallback de loading para o Suspense
 */
function ExpedientesLoading() {
  return (
    <div className="max-w-350 mx-auto space-y-5">
      {/* Header skeleton */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56 mt-1.5" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
      </div>

      {/* PulseStrip skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>

      {/* Controls skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-72 rounded-xl" />
        <div className="flex-1" />
        <Skeleton className="h-9 w-56 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      {/* Content skeleton */}
      <div className="space-y-3">
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
    <div className="max-w-350 mx-auto space-y-5">
      <Suspense fallback={<ExpedientesLoading />}>
        <ExpedientesContent visualizacao="quadro" />
      </Suspense>
    </div>
  );
}
