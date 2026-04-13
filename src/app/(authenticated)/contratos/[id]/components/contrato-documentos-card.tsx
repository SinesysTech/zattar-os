'use client';

import * as React from 'react';
import { FolderOpen, Plus, Upload } from 'lucide-react';

import { WidgetContainer } from '@/components/shared/glass-panel';
import { Button } from '@/components/ui/button';
import { ContratoDocumentosList } from '@/app/(authenticated)/pecas-juridicas';
import { ContratoDocumentoUploadDialog } from './contrato-documento-upload-dialog';

interface ContratoDocumentosCardProps {
  contratoId: number;
  onGerarPeca?: () => void;
}

export function ContratoDocumentosCard({
  contratoId,
  onGerarPeca,
}: ContratoDocumentosCardProps) {
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleUploadSuccess = React.useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <>
      <WidgetContainer
        title="Documentos e Peças Jurídicas"
        icon={FolderOpen}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setUploadDialogOpen(true)}>
              <Upload className="size-4 mr-1" />
              Novo Documento
            </Button>
            {onGerarPeca && (
              <Button variant="outline" size="sm" onClick={onGerarPeca}>
                <Plus className="size-4 mr-1" />
                Gerar Peça
              </Button>
            )}
          </div>
        }
      >
        <ContratoDocumentosList key={refreshKey} contratoId={contratoId} />
      </WidgetContainer>

      <ContratoDocumentoUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        contratoId={contratoId}
        onSuccess={handleUploadSuccess}
      />
    </>
  );
}
