'use client';

/**
 * Página de Audiências - Visualização Mensal
 */

import { Suspense } from 'react';
import { AudienciasContent } from '../components/audiencias-content';
import { Skeleton } from '@/components/ui/skeleton';

function AudienciasLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-3xl" />
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export default function AudienciasMesPage() {
  return (
    <div className="space-y-4">
      <Suspense fallback={<AudienciasLoading />}>
        <AudienciasContent visualizacao="mes" />
      </Suspense>
    </div>
  );
}

