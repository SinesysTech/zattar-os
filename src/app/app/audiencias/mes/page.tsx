import { Suspense } from 'react';
import { AudienciasContent } from '@/features/audiencias';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function AudienciasLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-50" />
        <Skeleton className="h-10 w-75" />
      </div>
      <Skeleton className="h-150 w-full" />
    </div>
  );
}

export default function AudienciasMesPage() {
  return (
    <Suspense fallback={<AudienciasLoading />}>
      <AudienciasContent visualizacao="mes" />
    </Suspense>
  );
}