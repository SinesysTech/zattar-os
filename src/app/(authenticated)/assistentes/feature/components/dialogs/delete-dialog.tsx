'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAssistenteMutations } from '../../hooks/use-assistente-mutations';
import { Assistente } from '../../domain';
import { Loader2 } from 'lucide-react';

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assistente: Assistente;
  onSuccess?: () => void;
}

export function DeleteDialog({
  open,
  onOpenChange,
  assistente,
  onSuccess,
}: DeleteDialogProps) {
  const { deletar, isLoading } = useAssistenteMutations();

  const handleDelete = async () => {
    const result = await deletar(assistente.id);
    if (result.success) {
      if (onSuccess) onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Assistente</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o assistente <strong>{assistente.nome}</strong>?
            <br />
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
