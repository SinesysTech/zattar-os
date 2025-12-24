'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DialogFormShell } from '@/components/shared/dialog-shell';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { actionAtualizarProcesso, type ActionResult } from '../actions';
import type { ProcessoUnificado } from '../domain';

interface Usuario {
  id: number;
  nomeExibicao: string;
}

interface ProcessosAlterarResponsavelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processo: ProcessoUnificado | null;
  usuarios: Usuario[];
  onSuccess: () => void;
}

const initialState: ActionResult = {
  success: false,
  message: '',
  error: '',
};

export function ProcessosAlterarResponsavelDialog({
  open,
  onOpenChange,
  processo,
  usuarios,
  onSuccess,
}: ProcessosAlterarResponsavelDialogProps) {
  const [responsavelId, setResponsavelId] = React.useState<string>('');

  // Criar função bound com o ID do processo
  const boundAction = React.useCallback(
    (prevState: ActionResult | null, formData: FormData) =>
      actionAtualizarProcesso(processo?.id || 0, prevState, formData),
    [processo?.id]
  );

  const [formState, formAction, isPending] = useActionState(
    boundAction,
    initialState
  );

  React.useEffect(() => {
    if (open && processo) {
      setResponsavelId(processo.responsavelId?.toString() || '');
    }
  }, [open, processo]);

  React.useEffect(() => {
    if (formState.success) {
      onSuccess();
      onOpenChange(false);
    }
  }, [formState.success, onSuccess, onOpenChange]);

  if (!processo) {
    return null;
  }

  const generalError = !formState.success && 'error' in formState ? (formState.error || formState.message) : null;

  const footerButtons = (
    <Button
      type="submit"
      disabled={isPending}
      form="alterar-responsavel-processo-form"
    >
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Salvar
    </Button>
  );

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title="Alterar Responsável"
      maxWidth="md"
      footer={footerButtons}
    >
      <form id="alterar-responsavel-processo-form" action={formAction} className="space-y-4">
        <input
          type="hidden"
          name="responsavelId"
          value={responsavelId === 'null' ? '' : responsavelId}
        />
        <div className="space-y-2">
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
            <p className="text-sm font-medium text-destructive">{generalError}</p>
          )}
        </div>
      </form>
    </DialogFormShell>
  );
}
