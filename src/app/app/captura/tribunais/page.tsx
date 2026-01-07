import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import TribunaisClient from './page-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function TribunaisLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-[500px] w-full" />
    </div>
  );
}

export default function TribunaisPage() {
  return (
    <Suspense fallback={<TribunaisLoading />}>
      <TribunaisClient />
    </Suspense>
  );
}
