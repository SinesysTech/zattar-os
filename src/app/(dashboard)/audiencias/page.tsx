import { Suspense } from 'react';
import { AudienciasContent } from '@/features/audiencias';
import { PageShell } from '@/components/shared';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function AudienciasLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-10 w-[300px]" />
      </div>
      <Skeleton className="h-[600px] w-full" />
    </div>
  );
}

export default function AudienciasPage() {
  return (
    <PageShell
      title="Audiências"
      description="Gerencie suas audiências e compromissos."
    >
      <Suspense fallback={<AudienciasLoading />}>
        <AudienciasContent visualizacao="semana" />
      </Suspense>
    </PageShell>
  );
}
