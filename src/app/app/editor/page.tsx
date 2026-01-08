'use client';

import dynamic from 'next/dynamic';
import { Toaster } from 'sonner';

import { Skeleton } from '@/components/ui/skeleton';

/**
 * PlateEditor skeleton para loading state
 */
function PlateEditorSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-8">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-5/6" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-4/5" />
    </div>
  );
}

/**
 * PlateEditor lazy-loaded para otimização de bundle (~500KB)
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading
 */
const PlateEditor = dynamic(
  () => import('@/components/editor/plate/plate-editor').then(m => ({ default: m.PlateEditor })),
  {
    ssr: false,
    loading: () => <PlateEditorSkeleton />
  }
);

export default function Page() {
  return (
    <div className="flex h-full w-full max-w-full overflow-x-hidden min-h-0">
      <PlateEditor />

      <Toaster />
    </div>
  );
}
