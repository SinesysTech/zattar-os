'use client';

import { Suspense } from 'react';
import { GazettePage } from './gazette-page';
import { Skeleton } from '@/components/ui/skeleton';

export function ComunicaCNJTabsContent() {
  return (
    <Suspense fallback={<GazettePageSkeleton />}>
      <GazettePage />
    </Suspense>
  );
}

function GazettePageSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-6">
      <div className="grid grid-cols-5 gap-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-10 rounded-lg" />
      <Skeleton className="h-8 rounded-lg w-1/2" />
      <div className="flex-1 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
