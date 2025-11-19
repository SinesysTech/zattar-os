'use client';

import { RepassesPendentesList } from '@/components/acordos-condenacoes/repasses-pendentes-list';
import { UploadDeclaracaoDialog } from '@/components/acordos-condenacoes/upload-declaracao-dialog';
import { UploadComprovanteDialog } from '@/components/acordos-condenacoes/upload-comprovante-dialog';
import { useState } from 'react';

interface DialogState {
  open: boolean;
  parcelaId: number | null;
  valorRepasse?: number;
}

export default function RepassesPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [declaracaoDialog, setDeclaracaoDialog] = useState<DialogState>({
    open: false,
    parcelaId: null,
  });
  const [comprovanteDialog, setComprovanteDialog] = useState<DialogState>({
    open: false,
    parcelaId: null,
    valorRepasse: 0,
  });

  const handleAnexarDeclaracao = (parcelaId: number) => {
    setDeclaracaoDialog({ open: true, parcelaId });
  };

  const handleRealizarRepasse = (parcelaId: number, valorRepasse: number) => {
    setComprovanteDialog({ open: true, parcelaId, valorRepasse });
  };

  const handleDialogSuccess = () => {
    // Forçar reload da lista
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Repasses Pendentes</h1>
        <p className="text-muted-foreground">
          Gerencie repasses aos clientes que precisam ser processados
        </p>
      </div>

      {/* Lista */}
      <RepassesPendentesList
        key={refreshKey}
        onAnexarDeclaracao={handleAnexarDeclaracao}
        onRealizarRepasse={handleRealizarRepasse}
      />

      {/* Dialogs */}
      {declaracaoDialog.parcelaId && (
        <UploadDeclaracaoDialog
          open={declaracaoDialog.open}
          onOpenChange={(open) =>
            setDeclaracaoDialog((prev) => ({ ...prev, open }))
          }
          parcelaId={declaracaoDialog.parcelaId}
          onSuccess={handleDialogSuccess}
        />
      )}

      {comprovanteDialog.parcelaId && (
        <UploadComprovanteDialog
          open={comprovanteDialog.open}
          onOpenChange={(open) =>
            setComprovanteDialog((prev) => ({ ...prev, open }))
          }
          parcelaId={comprovanteDialog.parcelaId}
          valorRepasse={comprovanteDialog.valorRepasse || 0}
          onSuccess={handleDialogSuccess}
        />
      )}
    </div>
  );
}
