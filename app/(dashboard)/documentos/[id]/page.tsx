/**
 * Página do editor de documentos
 * /documentos/[id]
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { DocumentEditor } from '@/components/documentos/document-editor';
import { DocumentEditorSkeleton } from '@/components/documentos/document-editor-skeleton';

export const metadata: Metadata = {
  title: 'Editor | Sinesys',
  description: 'Editor de documentos jurídicos',
};

interface PageProps {
  params: {
    id: string;
  };
}

export default function DocumentoEditorPage({ params }: PageProps) {
  const documentoId = parseInt(params.id);

  if (isNaN(documentoId)) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">ID inválido</h2>
          <p className="text-muted-foreground mt-2">
            O ID do documento fornecido não é válido.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <Suspense fallback={<DocumentEditorSkeleton />}>
        <DocumentEditor documentoId={documentoId} />
      </Suspense>
    </div>
  );
}
