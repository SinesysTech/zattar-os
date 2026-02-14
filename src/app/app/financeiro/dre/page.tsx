import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import DREClient from './page-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function DRELoading() {
  return (
    <div className="flex-1 space-y-6">
      {/* Header skeleton */}
      <div className="space-y-1.5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-80" />
      </div>

      {/* Period selector skeleton */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-16" />
          </div>
        </CardContent>
      </Card>

      {/* KPI cards skeleton */}
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs + table skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-96" />
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-8" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DREPage() {
  return (
    <Suspense fallback={<DRELoading />}>
      <DREClient />
    </Suspense>
  );
}
