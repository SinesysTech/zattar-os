'use client';

/**
 * Página de Representantes
 * Lista e gerencia representantes legais (advogados)
 */

import { Suspense } from 'react';
import { RepresentantesTab } from '../components/representantes-tab';
import { Skeleton } from '@/components/ui/skeleton';

function RepresentantesLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-3xl" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export default function RepresentantesPage() {
  return (
    <div className="space-y-4">
      <Suspense fallback={<RepresentantesLoading />}>
        <RepresentantesTab />
      </Suspense>
    </div>
  );
}

