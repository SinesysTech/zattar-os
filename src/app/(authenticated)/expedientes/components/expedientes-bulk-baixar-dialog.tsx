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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { actionBulkBaixar, type ActionResult } from '../actions';
import type { Expediente } from '../domain';
import { BulkSelectionPreview } from './bulk-selection-preview';

import { LoadingSpinner } from "@/components/ui/loading-state"
import { Text } from '@/components/ui/typography';
interface ExpedientesBulkBaixarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedExpedientes: Expediente[];
  onSuccess: () => void;
}

const initialState: ActionResult = {
  success: false,
  message: '',
  error: '',
};

export function ExpedientesBulkBaixarDialog({
  open,
  onOpenChange,
  selectedExpedientes,
  onSuccess,
}: ExpedientesBulkBaixarDialogProps) {
  const [justificativa, setJustificativa] = React.useState('');
  const expedienteIds = React.useMemo(
    () => selectedExpedientes.map((e) => e.id),
    [selectedExpedientes]
  );
  const actionWithIds = React.useCallback(
    async (prevState: ActionResult | null, formData: FormData) => {
      return actionBulkBaixar(expedienteIds, prevState, formData);
    },
    [expedienteIds]
  );

  const [formState, formAction, isPending] = useActionState(actionWithIds, initialState);

  React.useEffect(() => {
    if (open) {
      setJustificativa('');
    }
  }, [open]);

  React.useEffect(() => {
    if (formState.success) {
      toast.success('Expedientes baixados em lote', {
        description:
          formState.message ||
          `${expedienteIds.length} ${expedienteIds.length === 1 ? 'expediente foi baixado' : 'expedientes foram baixados'} com sucesso.`,
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
      toast.error('Falha na baixa em lote', { description: err });
    }
    if (formState.success) lastErrorRef.current = undefined;
  }, [formState]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('justificativaBaixa', justificativa.trim());
    formAction(formData);
  };

  const generalError = !formState.success ? (formState.error || formState.message) : null;

  const motivoDisabled = !justificativa.trim()
    ? 'Informe a justificativa para habilitar'
    : undefined;
  const footerButtons = (
    <Button
      type="submit"
      disabled={isPending || !justificativa.trim()}
      form="bulk-baixar-form"
      title={motivoDisabled}
    >
      {isPending && <LoadingSpinner className="mr-2" />}
      Baixar {expedienteIds.length} {expedienteIds.length === 1 ? 'expediente' : 'expedientes'}
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
          <DialogTitle>{`Baixar ${expedienteIds.length} ${expedienteIds.length === 1 ? 'Expediente' : 'Expedientes'}`}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 [scrollbar-width:thin]">
          <form id="bulk-baixar-form" onSubmit={handleSubmit} className={cn("stack-default")}>
            <BulkSelectionPreview expedientes={selectedExpedientes} />
            <div className={cn("stack-tight")}>
              <Label htmlFor="justificativaBaixa">
                Justificativa da Baixa <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="justificativaBaixa"
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                placeholder="Informe a justificativa para a baixa dos expedientes selecionados..."
                className="resize-none min-h-25"
                disabled={isPending}
                required
              />
              <Text variant="caption">
                Esta justificativa será aplicada a todos os {expedienteIds.length} expediente(s) selecionado(s).
              </Text>
              {generalError && (
                <p role="alert" className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-body-sm font-medium text-destructive")}>{generalError}</p>
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

