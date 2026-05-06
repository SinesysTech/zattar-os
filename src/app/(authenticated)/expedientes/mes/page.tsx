import { cn } from '@/lib/utils';
import { Suspense } from 'react';
import { Metadata } from 'next';
import { ExpedientesContent } from '@/app/(authenticated)/expedientes';
import { PageShell } from '@/components/shared';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Expedientes | Mês',
  description: 'Visualização mensal de expedientes',
};

export const dynamic = 'force-dynamic';

function ExpedientesLoading() {
  return (
    <div className={cn("flex flex-col inline-default")}>
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default function ExpedientesMesPage() {
  return (
    <PageShell>
      <Suspense fallback={<ExpedientesLoading />}>
        <ExpedientesContent visualizacao="mes" />
      </Suspense>
    </PageShell>
  );
}
