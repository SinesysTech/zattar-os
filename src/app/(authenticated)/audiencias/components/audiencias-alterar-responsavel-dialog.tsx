'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';
import { useActionState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/typography';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { actionAtualizarAudiencia, type ActionResult } from '../actions';
import type { Audiencia } from '../domain';

import { LoadingSpinner } from "@/components/ui/loading-state"
interface Usuario {
  id: number;
  nomeExibicao?: string;
  nomeCompleto?: string;
}

interface AudienciasAlterarResponsavelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audiencia: Audiencia | null;
  usuarios: Usuario[];
  onSuccess: () => void;
}

const initialState: ActionResult = {
  success: false,
  message: '',
  error: '',
};

function getUsuarioNome(u: Usuario): string {
  return u.nomeExibicao || u.nomeCompleto || `Usuário ${u.id}`;
}

export function AudienciasAlterarResponsavelDialog({
  open,
  onOpenChange,
  audiencia,
  usuarios,
  onSuccess,
}: AudienciasAlterarResponsavelDialogProps) {
  const [responsavelId, setResponsavelId] = React.useState<string>('');

  const submitAction = async (state: ActionResult, payload: FormData) => {
    return actionAtualizarAudiencia(audiencia?.id || 0, state, payload);
  };

  const [formState, formAction, isPending] = useActionState(
    submitAction,
    initialState
  );

  React.useEffect(() => {
    if (open && audiencia) {
      setResponsavelId(audiencia.responsavelId?.toString() || '');
    }
  }, [open, audiencia]);

  React.useEffect(() => {
    if (formState.success) {
      toast.success(formState.message || 'Responsável atualizado.');
      onSuccess();
      onOpenChange(false);
    } else if (!formState.success && formState.error) {
      toast.error(formState.message || 'Falha ao atualizar responsável.', {
        description: formState.error,
      });
    }
  }, [formState, onSuccess, onOpenChange]);

  if (!audiencia) {
    return null;
  }

  const generalError = !formState.success ? (formState.error || formState.message) : null;

  const footerButtons = (
    <Button
      type="submit"
      disabled={isPending}
      form="alterar-responsavel-audiencia-form"
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
        className="sm:max-w-md glass-dialog overflow-hidden p-0 gap-0 max-h-[90vh] flex flex-col"
      >
        <DialogHeader className="px-6 py-4 border-b border-border/20 shrink-0">
          <DialogTitle>Alterar Responsável</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <form id="alterar-responsavel-audiencia-form" action={formAction} className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4")}>
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
                      {getUsuarioNome(usuario)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {generalError && (
                <Text variant="caption" className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium text-destructive")}>{generalError}</Text>
              )}
            </div>
          </form>
        </DialogBody>
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
