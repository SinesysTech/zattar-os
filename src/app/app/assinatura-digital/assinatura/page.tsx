import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import AssinaturaPageClient from './page-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function AssinaturaLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[300px]" />
        <Skeleton className="h-4 w-[400px]" />
      </div>
      <div className="rounded-lg border p-6 space-y-4">
        <Skeleton className="h-6 w-[200px]" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function AssinaturaPage() {
  return (
    <Suspense fallback={<AssinaturaLoading />}>
      <AssinaturaPageClient />
    </Suspense>
  );
}
