import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import LixeiraClient from './page-client';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Lixeira | Documentos',
  description: 'Documentos excluídos que serão deletados permanentemente após 30 dias',
};

function LixeiraLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export default function LixeiraPage() {
  return (
    <Suspense fallback={<LixeiraLoading />}>
      <LixeiraClient />
    </Suspense>
  );
}
