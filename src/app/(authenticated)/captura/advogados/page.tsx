import { cn } from '@/lib/utils';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import AdvogadosClient from './page-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function AdvogadosLoading() {
  return (
    <div className={cn("flex flex-col stack-default")}>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-[500px] w-full" />
    </div>
  );
}

export default function AdvogadosPage() {
  return (
    <Suspense fallback={<AdvogadosLoading />}>
      <AdvogadosClient />
    </Suspense>
  );
}
