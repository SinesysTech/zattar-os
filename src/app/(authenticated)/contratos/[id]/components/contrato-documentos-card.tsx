'use client';

import * as React from 'react';
import { FileText, Plus, Upload } from 'lucide-react';

import {
  DetailSection,
  DetailSectionCard,
} from '@/components/shared/detail-section';
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
      <DetailSection
        icon={FileText}
        label="Peças jurídicas e anexos"
        action={
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUploadDialogOpen(true)}
              className="rounded-xl"
            >
              <Upload className="size-3.5" />
              Novo
            </Button>
            {onGerarPeca ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onGerarPeca}
                className="rounded-xl"
              >
                <Plus className="size-3.5" />
                Gerar peça
              </Button>
            ) : null}
          </div>
        }
      >
        <DetailSectionCard>
          <ContratoDocumentosList key={refreshKey} contratoId={contratoId} />
        </DetailSectionCard>
      </DetailSection>

      <ContratoDocumentoUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        contratoId={contratoId}
        onSuccess={handleUploadSuccess}
      />
    </>
  );
}
