import { Suspense } from 'react';
import { AudienciasContent } from '@/features/audiencias';
import { fetchAudienciasPageData } from '@/features/audiencias/queries';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function AudienciasLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-50" />
        <Skeleton className="h-10 w-50" />
      </div>
      <Skeleton className="h-150 w-full" />
    </div>
  );
}

export default async function AudienciasSemanaPage() {
  const { usuarios, tiposAudiencia } = await fetchAudienciasPageData();

  return (
    <Suspense fallback={<AudienciasLoading />}>
      <AudienciasContent
        visualizacao="semana"
        initialUsuarios={usuarios}
        initialTiposAudiencia={tiposAudiencia}
      />
    </Suspense>
  );
}
