'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AssistenteForm } from '../forms/assistente-form';
import { useAssistenteMutations } from '../../hooks/use-assistente-mutations';
import { Assistente } from '../../domain';

interface EditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assistente: Assistente;
  onSuccess?: () => void;
}

export function EditDialog({
  open,
  onOpenChange,
  assistente,
  onSuccess,
}: EditDialogProps) {
  const { atualizar, isLoading } = useAssistenteMutations();

  const handleSubmit = async (formData: FormData) => {
    const result = await atualizar(assistente.id, formData);
    if (result.success) {
      if (onSuccess) onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Assistente</DialogTitle>
          <DialogDescription>
            Atualize as informações do assistente no sistema.
          </DialogDescription>
        </DialogHeader>

        <AssistenteForm 
          initialData={assistente}
          onSubmit={handleSubmit} 
          onCancel={() => onOpenChange(false)}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
