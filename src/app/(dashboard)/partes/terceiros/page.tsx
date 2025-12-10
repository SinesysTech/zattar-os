'use client';

/**
 * Página de Terceiros
 * Lista e gerencia terceiros vinculados aos processos (peritos, MP, assistentes, etc.)
 */

import { Suspense } from 'react';
import { TerceirosTab } from '../components/terceiros-tab';
import { Skeleton } from '@/components/ui/skeleton';

function TerceirosLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-3xl" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export default function TerceirosPage() {
  return (
    <div className="space-y-4">
      <Suspense fallback={<TerceirosLoading />}>
        <TerceirosTab />
      </Suspense>
    </div>
  );
}

