import { cn } from '@/lib/utils';
import { Suspense } from 'react';
import { FolhasPagamentoList } from '@/app/(authenticated)/rh';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function FolhasLoading() {
  return (
    <div className={cn("stack-default")}>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export default function FolhasPagamentoPage() {
  return (
    <Suspense fallback={<FolhasLoading />}>
      <FolhasPagamentoList />
    </Suspense>
  );
}
