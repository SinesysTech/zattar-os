"use client";

import * as React from 'react';
import { useParams } from 'next/navigation';
import { DocumentEditor } from '@/app/(authenticated)/documentos';
import { Typography } from '@/components/ui/typography';

export function DocumentoEditorClient() {
  const params = useParams<{ id: string }>();
  const documentoId = React.useMemo(() => parseInt(params.id, 10), [params.id]);

  if (isNaN(documentoId)) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Typography.H2>ID inválido</Typography.H2>
          <p className="text-muted-foreground mt-2">O ID do documento fornecido não é válido.</p>
        </div>
      </div>
    );
  }

  return <DocumentEditor documentoId={documentoId} />;
}
