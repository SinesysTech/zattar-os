import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import PlaygroundClient from './page-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function PlaygroundLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-[600px] w-full" />
    </div>
  );
}

export default function PlaygroundPage() {
  return (
    <Suspense fallback={<PlaygroundLoading />}>
      <PlaygroundClient />
    </Suspense>
  );
}
