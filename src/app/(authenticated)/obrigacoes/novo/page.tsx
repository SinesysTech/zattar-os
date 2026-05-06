import { cn } from '@/lib/utils';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import NovaObrigacaoClient from './page-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function FormLoading() {
  return (
    <div className={cn("flex flex-col py-8 stack-loose max-w-4xl mx-auto")}>
      <div className={cn("flex items-center inline-default")}>
        <Skeleton className="h-10 w-10" />
        <div className={cn("flex flex-col stack-tight")}>
          <Skeleton className="h-8 w-[300px]" />
          <Skeleton className="h-4 w-[400px]" />
        </div>
      </div>
      <div className={cn("rounded-lg border bg-card inset-dialog")}>
        <div className={cn("flex flex-col stack-default")}>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>
    </div>
  );
}

export default function NovaObrigacaoPage() {
  return (
    <Suspense fallback={<FormLoading />}>
      <NovaObrigacaoClient />
    </Suspense>
  );
}
