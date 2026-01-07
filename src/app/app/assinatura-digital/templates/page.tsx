import { Suspense } from 'react';
import { PageShell } from '@/components/shared/page-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { ClientLoader } from './client-loader';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function TemplatesLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-[500px] w-full" />
    </div>
  );
}

export default function Page() {
  return (
    <PageShell>
      <Suspense fallback={<TemplatesLoading />}>
        <ClientLoader />
      </Suspense>
    </PageShell>
  );
}
