import { Suspense } from 'react';
import { ExpedientesContent } from '@/app/(authenticated)/expedientes';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

/**
 * Fallback de loading para o Suspense
 */
function ExpedientesLoading() {
  return (
    <div className="max-w-350 mx-auto flex flex-col gap-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

/**
 * Página raiz de Expedientes
 * Renderiza visualização unificada com alternância entre semana, mês, ano e lista
 */
export default function ExpedientesPage() {
  return (
    <div className="max-w-350 mx-auto space-y-5 py-6">
      <Suspense fallback={<ExpedientesLoading />}>
        <ExpedientesContent visualizacao="quadro" />
      </Suspense>
    </div>
  );
}
