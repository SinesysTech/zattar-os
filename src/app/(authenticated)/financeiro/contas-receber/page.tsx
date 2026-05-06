import { cn } from '@/lib/utils';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import ContasReceberClient from './page-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function ContasReceberLoading() {
  return (
    <div className={cn("flex flex-col stack-medium")}>
      <div className={cn("grid grid-cols-2 sm:grid-cols-4 inline-default")}>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-100 w-full" />
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
