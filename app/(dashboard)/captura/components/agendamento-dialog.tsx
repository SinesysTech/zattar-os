'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AgendamentoForm } from './agendamentos/agendamento-form';

interface AgendamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AgendamentoDialog({
  open,
  onOpenChange,
  onSuccess,
}: AgendamentoDialogProps) {
  const handleSuccess = () => {
    // Fechar o dialog após sucesso
    onOpenChange(false);
    // Chamar callback externo se fornecido
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
          <DialogDescription>
            Configure um agendamento para execução automática de capturas do PJE-TRT.
            Selecione o tipo de captura, periodicidade e horário de execução.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          <AgendamentoForm onSuccess={handleSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
