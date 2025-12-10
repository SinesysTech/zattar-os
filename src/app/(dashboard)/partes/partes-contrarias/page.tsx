'use client';

/**
 * Página de Partes Contrárias
 * Lista e gerencia partes contrárias dos processos
 */

import { Suspense } from 'react';
import { PartesContrariasTableWrapper } from '@/features/partes';
import { Skeleton } from '@/components/ui/skeleton';

function PartesContrariasLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-3xl" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export default function PartesContrariasPage() {
  return (
    <div className="space-y-4">
      <Suspense fallback={<PartesContrariasLoading />}>
        <PartesContrariasTableWrapper />
      </Suspense>
    </div>
  );
}

