import { cn } from '@/lib/utils';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import ConciliacaoBancariaClient from './page-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function ConciliacaoLoading() {
  return (
    <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4")}>
      <div className="flex items-center justify-between">
        <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
          <Skeleton className="h-8 w-62.5" />
          <Skeleton className="h-4 w-87.5" />
        </div>
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex gap-2")}>
          <Skeleton className="h-10 w-45" />
          <Skeleton className="h-10 w-32.5" />
        </div>
      </div>
      <Skeleton className="h-25 w-full" />
      <Skeleton className="h-100ull" />
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
