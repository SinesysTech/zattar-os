
'use client';

import { useState } from 'react';
import { RepassesPendentesList } from '@/features/obrigacoes/components/repasses/repasses-pendentes-list';
import { UploadDeclaracaoDialog } from '@/features/obrigacoes/components/repasses/upload-declaracao-dialog';
import { UploadComprovanteDialog } from '@/features/obrigacoes/components/repasses/upload-comprovante-dialog';

interface DialogState {
  open: boolean;
  parcelaId: number | null;
  valorRepasse?: number;
}

export default function RepassesPage() {
  const [refreshKey, setRefreshKey] = useState(0); // Trigger re-fetching logic in list if needed or just rely on react-query/hooks
  
  // Note: The List component now uses a hook that fetches on mount. 
  // 'refreshKey' isn't explicitly used as a prop in the new list component to force refetch,
  // but we can pass 'onSuccess' to the dialogs which invalidates cache or we rely on revalidatePath in actions which should handle it if using server components or router refresh.
  // Ideally, the list should accept a key or provide a refetch method.
  // The migrated RepassesPendentesList component uses useRepassesPendentes().
  // I should update RepassesPendentesList to accept a key or check if it refetches automatically.
  // In `use-repasses-pendentes.ts` I didn't add a dependency on an external key.
  // However, the actions call revalidatePath('/repasses'). Next.js router.refresh() might be needed in the page after success.
  
  const [declaracaoDialog, setDeclaracaoDialog] = useState<DialogState>({ open: false, parcelaId: null });
  const [comprovanteDialog, setComprovanteDialog] = useState<DialogState>({ open: false, parcelaId: null, valorRepasse: 0 });

  const handleAnexarDeclaracao = (parcelaId: number) => {
    setDeclaracaoDialog({ open: true, parcelaId });
  };

  const handleRealizarRepasse = (parcelaId: number, valorRepasse: number) => {
    setComprovanteDialog({ open: true, parcelaId, valorRepasse });
  };

  const handleDialogSuccess = () => {
    setRefreshKey(prev => prev + 1);
    // In a real scenario with server actions and revalidatePath, 
    // we might want to call router.refresh() here to update server components,
    // but our list is client-side fetching via hook. 
    // We should probably expose refetch in the hook or just force remount with key.
    // I will pass 'key={refreshKey}' to the list component, this will force it to unmount/remount and thus fetch again.
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Repasses Pendentes</h1>
        <p className="text-muted-foreground">Gerencie repasses aos clientes que precisam ser processados</p>
      </div>

      <RepassesPendentesList
        key={refreshKey}
        onAnexarDeclaracao={handleAnexarDeclaracao}
        onRealizarRepasse={handleRealizarRepasse}
      />

      {declaracaoDialog.parcelaId && (
        <UploadDeclaracaoDialog
          open={declaracaoDialog.open}
          onOpenChange={(open) => setDeclaracaoDialog(prev => ({ ...prev, open }))}
          parcelaId={declaracaoDialog.parcelaId}
          onSuccess={handleDialogSuccess}
        />
      )}

      {comprovanteDialog.parcelaId && (
        <UploadComprovanteDialog
          open={comprovanteDialog.open}
          onOpenChange={(open) => setComprovanteDialog(prev => ({ ...prev, open }))}
          parcelaId={comprovanteDialog.parcelaId}
          valorRepasse={comprovanteDialog.valorRepasse || 0}
          onSuccess={handleDialogSuccess}
        />
      )}
    </div>
  );
}
