'use client';

import {
  cn } from '@/lib/utils';
import * as React from 'react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { actionBulkTransferirResponsavel, type ActionResult } from '../actions';
import type { Expediente } from '../domain';
import { BulkSelectionPreview } from './bulk-selection-preview';

import { LoadingSpinner } from "@/components/ui/loading-state"
interface Usuario {
  id: number;
  nomeExibicao: string;
}

interface ExpedientesBulkTransferirDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedExpedientes: Expediente[];
  usuarios: Usuario[];
  onSuccess: () => void;
}

const initialState: ActionResult = {
  success: false,
  message: '',
  error: '',
};

export function ExpedientesBulkTransferirDialog({
  open,
  onOpenChange,
  selectedExpedientes,
  usuarios,
  onSuccess,
}: ExpedientesBulkTransferirDialogProps) {
  const [responsavelId, setResponsavelId] = React.useState<string>('');
  const expedienteIds = React.useMemo(
    () => selectedExpedientes.map((e) => e.id),
    [selectedExpedientes]
  );
  const actionWithIds = React.useCallback(
    async (prevState: ActionResult | null, formData: FormData) => {
      return actionBulkTransferirResponsavel(expedienteIds, prevState, formData);
    },
    [expedienteIds]
  );

  const [formState, formAction, isPending] = useActionState(actionWithIds, initialState);

  React.useEffect(() => {
    if (open) {
      setResponsavelId('');
    }
  }, [open]);

  React.useEffect(() => {
    if (formState.success) {
      toast.success('Responsável transferido', {
        description:
          formState.message ||
          `${expedienteIds.length} ${expedienteIds.length === 1 ? 'expediente foi transferido' : 'expedientes foram transferidos'}.`,
      });
      onSuccess();
      onOpenChange(false);
    }
  }, [formState.success, formState.message, expedienteIds.length, onSuccess, onOpenChange]);

  const lastErrorRef = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    const err = !formState.success ? formState.error : undefined;
    if (err && err !== lastErrorRef.current) {
      lastErrorRef.current = err;
      toast.error('Falha na transferência em lote', { description: err });
    }
    if (formState.success) lastErrorRef.current = undefined;
  }, [formState]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    if (responsavelId === '' || responsavelId === 'null') {
      formData.append('responsavelId', '');
    } else {
      formData.append('responsavelId', responsavelId);
    }
    formAction(formData);
  };

  const generalError = !formState.success ? (formState.error || formState.message) : null;

  const motivoDisabled = !responsavelId || responsavelId === 'null'
    ? 'Selecione um responsável para habilitar'
    : undefined;
  const footerButtons = (
    <Button
      type="submit"
      disabled={isPending || !responsavelId || responsavelId === 'null'}
      form="bulk-transferir-form"
      title={motivoDisabled}
    >
      {isPending && <LoadingSpinner className="mr-2" />}
      Transferir {expedienteIds.length} {expedienteIds.length === 1 ? 'expediente' : 'expedientes'}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        data-density="comfortable"
        className="sm:max-w-md  overflow-hidden p-0 gap-0 max-h-[90vh] flex flex-col"
      >
        <DialogHeader className="px-6 py-4 border-b border-border/20 shrink-0">
          <DialogTitle>{`Transferir ${expedienteIds.length} ${expedienteIds.length === 1 ? 'Expediente' : 'Expedientes'}`}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 [scrollbar-width:thin]">
          <form id="bulk-transferir-form" onSubmit={handleSubmit} className={cn("flex flex-col stack-default")}>
            <BulkSelectionPreview expedientes={selectedExpedientes} />
            <div className={cn("flex flex-col stack-tight")}>
              <Label htmlFor="responsavelId">Novo Responsável</Label>
              <Select
                value={responsavelId || 'null'}
                onValueChange={setResponsavelId}
                disabled={isPending}
              >
                <SelectTrigger id="responsavelId" className="w-full">
                  <SelectValue placeholder="Selecione um responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Sem responsável</SelectItem>
                  {usuarios.map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id.toString()}>
                      {usuario.nomeExibicao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {generalError && (
                <p role="alert" className={cn( "text-body-sm font-medium text-destructive")}>{generalError}</p>
              )}
            </div>
          </form>
        </div>
        <div className="px-6 py-4 border-t border-border/20 shrink-0 flex items-center justify-between gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <div className="flex items-center gap-2">
            {footerButtons}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

