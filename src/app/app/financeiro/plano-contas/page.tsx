import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import PlanoContasClient from './page-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function PlanoContasLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-[500px] w-full" />
    </div>
  );
}

export default function PlanoContasPage() {
  return (
    <Suspense fallback={<PlanoContasLoading />}>
      <PlanoContasClient />
    </Suspense>
  );
}
