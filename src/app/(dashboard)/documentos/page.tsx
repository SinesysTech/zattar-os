/**
 * Página de listagem de documentos e arquivos
 * /documentos
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { FileManagerUnified } from '@/features/documentos';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Documentos | Sinesys',
  description: 'Gerencie seus documentos e arquivos',
};

export default function DocumentosPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 h-full overflow-hidden">
        <Suspense fallback={<FileManagerSkeleton />}>
          <FileManagerUnified />
        </Suspense>
      </div>
    </div>
  );
}

function FileManagerSkeleton() {
  return (
    <div className="flex-1 space-y-4 p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
      <Skeleton className="h-10 w-full max-w-sm" />
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
