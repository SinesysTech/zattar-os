import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Assistente } from "@/core/app/_lib/types";
import { useState } from "react";
import { toast } from "sonner";

interface AssistenteDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assistente: Assistente | null;
  onSuccess: () => void;
}

export function AssistenteDeleteDialog({ open, onOpenChange, assistente, onSuccess }: AssistenteDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!assistente) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/assistentes/${assistente.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar assistente');
      }

      toast.success('Assistente deletado com sucesso');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao deletar assistente');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deletar Assistente</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja deletar o assistente &quot;{assistente?.nome}&quot;? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deletando...' : 'Deletar'}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
