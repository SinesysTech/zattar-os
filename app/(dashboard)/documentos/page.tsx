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
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Documentos</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie e edite seus documentos jurídicos
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        <Suspense fallback={<DocumentListSkeleton />}>
          <DocumentList />
        </Suspense>
      </div>
    </div>
  );
}
