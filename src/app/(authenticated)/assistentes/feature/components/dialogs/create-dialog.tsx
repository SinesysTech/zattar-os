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

interface CreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateDialogProps) {
  const { criar, isLoading } = useAssistenteMutations();

  const handleSubmit = async (formData: FormData) => {
    const result = await criar(formData);
    if (result.success) {
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Assistente</DialogTitle>
          <DialogDescription>
            Preencha os dados para criar um novo assistente de IA no sistema
          </DialogDescription>
        </DialogHeader>

        <AssistenteForm 
          onSubmit={handleSubmit} 
          onCancel={() => onOpenChange(false)}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
