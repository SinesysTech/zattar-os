import { cn } from '@/lib/utils';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import DREClient from './page-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function DRELoading() {
  return (
    <div className="w-full">
      {/* DataTableToolbar skeleton - Linha 1: Título */}
      <div className={cn("flex items-center justify-between py-4")}>
        <Skeleton className="h-8 w-32" />
      </div>

      {/* DataTableToolbar skeleton - Linha 2: Filtros */}
      <div className={cn("flex items-center inline-default pb-4")}>
        <div className={cn("flex items-center inline-tight flex-1")}>
          <Skeleton className="h-9 w-80" />
          <Skeleton className="h-6 w-px" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className={cn("flex items-center inline-medium")}>
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-px" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>

      {/* KPI cards */}
      <div className={cn("grid inline-medium md:grid-cols-2 lg:grid-cols-4")}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-l-4 border-l-muted">
            <CardContent className={cn("inset-card-compact")}>
              <Skeleton className="h-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs + content */}
      <div className={cn("mt-4 stack-medium")}>
        <Skeleton className="h-10 w-80" />
        <Card>
          <CardContent className={cn("pt-6")}>
            <div className={cn("stack-snug")}>
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-7" />
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
