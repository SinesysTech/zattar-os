'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocumentosList } from './documentos-list';
import { UploadDocumentoDialog } from './upload-documento-dialog';
import type { KnowledgeBase, KnowledgeDocument } from '../../domain';

interface Props {
  base: KnowledgeBase;
  documentos: KnowledgeDocument[];
  isSuperAdmin: boolean;
}

export function DocumentosTab({ base, documentos, isSuperAdmin }: Props) {
  const [uploadAberto, setUploadAberto] = useState(false);

  return (
    <div className="space-y-4">
      {isSuperAdmin && (
        <div className="flex justify-end">
          <Button size="sm" className="rounded-xl" onClick={() => setUploadAberto(true)}>
            <Plus className="size-3.5" />
            Adicionar documento
          </Button>
        </div>
      )}

      <DocumentosList
        baseSlug={base.slug}
        documentos={documentos}
        isSuperAdmin={isSuperAdmin}
      />

      <UploadDocumentoDialog
        open={uploadAberto}
        onOpenChange={setUploadAberto}
        baseSlug={base.slug}
      />
    </div>
  );
}
