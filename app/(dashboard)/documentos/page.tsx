/**
 * Página de listagem de documentos
 * /documentos
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { DocumentList } from '@/components/documentos/document-list';
import { DocumentListSkeleton } from '@/components/documentos/document-list-skeleton';

export const metadata: Metadata = {
  title: 'Documentos | Sinesys',
  description: 'Gerencie seus documentos jurídicos',
};

export default function DocumentosPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 h-full overflow-hidden rounded-xl border border-border shadow-sm">
        <Suspense fallback={<DocumentListSkeleton />}>
          <DocumentList />
        </Suspense>
      </div>
    </div>
  );
}
