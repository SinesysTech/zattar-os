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
import { LoadingSpinner } from '@/components/ui/loading-state';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { actionAtualizarExpediente, type ActionResult } from '../actions';
import { Expediente } from '../domain';

interface Usuario {
  id: number;
  nomeExibicao: string;
}

interface ExpedientesAlterarResponsavelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expediente: Expediente | null;
  usuarios: Usuario[];
  onSuccess: () => void;
}

const initialState: ActionResult = {
  success: false,
  message: '',
  error: '',
};

export function ExpedientesAlterarResponsavelDialog({
  open,
  onOpenChange,
  expediente,
  usuarios,
  onSuccess,
}: ExpedientesAlterarResponsavelDialogProps) {
  const [responsavelId, setResponsavelId] = React.useState<string>('');
  const wasSuccessRef = React.useRef(false);
  
  const submitAction = async (state: ActionResult, payload: FormData) => {
    return actionAtualizarExpediente(expediente?.id || 0, state, payload);
  };

  const [formState, formAction, isPending] = useActionState(
    submitAction,
    initialState
  );

  React.useEffect(() => {
    if (open && expediente) {
      setResponsavelId(expediente.responsavelId?.toString() || '');
    }
  }, [open, expediente]);

  React.useEffect(() => {
    if (!open) {
      wasSuccessRef.current = false;
    }
  }, [open]);

  React.useEffect(() => {
    const hasJustSucceeded = formState.success && !wasSuccessRef.current;

    if (hasJustSucceeded) {
      toast.success('Responsável atualizado', {
        description: formState.message || 'O responsável do expediente foi alterado.',
      });
      onSuccess();
      onOpenChange(false);
    }

    wasSuccessRef.current = formState.success;
  }, [formState.success, formState.message, onSuccess, onOpenChange]);

  // Toast para erros
  const lastErrorRef = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    const err = !formState.success ? formState.error : undefined;
    if (err && err !== lastErrorRef.current) {
      lastErrorRef.current = err;
      toast.error('Não foi possível alterar o responsável', { description: err });
    }
    if (formState.success) lastErrorRef.current = undefined;
  }, [formState]);

  if (!expediente) {
    return null;
  }

  const generalError = !formState.success ? (formState.error || formState.message) : null;

  const footerButtons = (
    <Button
      type="submit"
      disabled={isPending}
      form="alterar-responsavel-form"
    >
      {isPending && <LoadingSpinner className="mr-2" />}
      Salvar
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
          <DialogTitle>Alterar Responsável</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 [scrollbar-width:thin]">
          <form id="alterar-responsavel-form" action={formAction} className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4")}>
            <input
              type="hidden"
              name="responsavelId"
              value={responsavelId === 'null' ? '' : responsavelId}
            />
            <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
              <Label htmlFor="responsavelId">Responsável</Label>
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
                <p role="alert" className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-medium → className de <Text>/<Heading> */ "text-sm font-medium text-destructive")}>{generalError}</p>
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

