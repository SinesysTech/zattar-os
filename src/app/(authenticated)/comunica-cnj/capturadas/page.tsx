import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { CapturadasClient } from '../capturadas-client';

export const dynamic = 'force-dynamic';

function CapturadasLoading() {
  return (
    <div className="flex flex-col gap-5 px-6 py-6">
      <Skeleton className="h-9 w-40 rounded-xl" />
      <Skeleton className="h-10 w-60 rounded" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

/**
 * Página de Gestão — Comunicações Capturadas.
 * Painel operacional com KPIs, filtros, listagem, prazos e vinculação.
 */
export default function CapturadasPage() {
  return (
    <Suspense fallback={<CapturadasLoading />}>
      <CapturadasClient />
    </Suspense>
  );
}
