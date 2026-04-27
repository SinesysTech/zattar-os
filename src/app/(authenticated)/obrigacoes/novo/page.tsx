import { cn } from '@/lib/utils';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import NovaObrigacaoClient from './page-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function FormLoading() {
  return (
    <div className={cn(/* design-system-escape: py-8 padding direcional sem Inset equiv.; space-y-6 → migrar para <Stack gap="loose"> */ "py-8 space-y-6 max-w-4xl mx-auto")}>
      <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "flex items-center gap-4")}>
        <Skeleton className="h-10 w-10" />
        <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
          <Skeleton className="h-8 w-[300px]" />
          <Skeleton className="h-4 w-[400px]" />
        </div>
      </div>
      <div className={cn(/* design-system-escape: p-6 → migrar para <Inset variant="dialog"> */ "rounded-lg border bg-card p-6")}>
        <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4")}>
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
