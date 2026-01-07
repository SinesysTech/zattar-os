import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import ConciliacaoBancariaClient from './page-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function ConciliacaoLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-4 w-[350px]" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-[130px]" />
        </div>
      </div>
      <Skeleton className="h-[100px] w-full" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export default function ConciliacaoBancariaPage() {
  return (
    <Suspense fallback={<ConciliacaoLoading />}>
      <ConciliacaoBancariaClient />
    </Suspense>
  );
}
