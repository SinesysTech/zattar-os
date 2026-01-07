import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import LixeiraClient from './page-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function LixeiraLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export default function LixeiraPage() {
  return (
    <Suspense fallback={<LixeiraLoading />}>
      <LixeiraClient />
    </Suspense>
  );
}
