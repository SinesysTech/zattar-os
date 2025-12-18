import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import ContasReceberClient from './page-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function ContasReceberLoading() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-4">
        <Skeleton className="h-[80px] w-full" />
        <Skeleton className="h-[80px] w-full" />
        <Skeleton className="h-[80px] w-full" />
        <Skeleton className="h-[80px] w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export default function ContasReceberPage() {
  return (
    <Suspense fallback={<ContasReceberLoading />}>
      <ContasReceberClient />
    </Suspense>
  );
}
