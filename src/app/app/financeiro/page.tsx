import { Suspense } from 'react';
import { PageShell } from '@/components/shared/page-shell';
import { GestaoDashboardsTabs } from '@/features/financeiro';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function FinanceiroPage() {
  return (
    <PageShell title="Dashboards">
      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <GestaoDashboardsTabs />
      </Suspense>
    </PageShell>
  );
}
