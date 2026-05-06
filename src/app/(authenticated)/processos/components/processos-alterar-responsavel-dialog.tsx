'use client';

import {
  cn } from '@/lib/utils';
import * as React from 'react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/typography';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { actionAtualizarProcesso } from '../actions';
import type { ActionResult } from '../actions/types';
import type { ProcessoUnificado } from '../domain';

import { LoadingSpinner } from "@/components/ui/loading-state"
interface Usuario {
  id: number;
  nomeExibicao: string;
}

interface ProcessosAlterarResponsavelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processo: ProcessoUnificado | null;
  usuarios: Usuario[];
  onSuccess: (updatedProcesso?: ProcessoUnificado) => void;
}

const initialState: ActionResult | null = null;

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
    (prevState: ActionResult | null, formData: FormData) => {
      return actionAtualizarProcesso(processo?.id || 0, prevState, formData);
    },
    [processo?.id]
  );

  const [formState, formAction, isPending] = useActionState(
    boundAction,
    initialState
  );

  React.useEffect(() => {
    if (open && processo) {
      setResponsavelId(processo.responsavelId?.toString() || '');
    } else if (!open) {
      // Reset do estado quando o diálogo fecha
      setResponsavelId('');
    }
  }, [open, processo]);

  React.useEffect(() => {
    // Só processar se formState não for null (ou seja, se a action já foi executada)
    if (!formState) return;

    if (formState.success) {
      const updatedProcesso = formState.data as ProcessoUnificado | undefined;
      onSuccess(updatedProcesso);
      onOpenChange(false);
    }
  }, [formState, onSuccess, onOpenChange]);

  if (!processo) {
    return null;
  }

  const generalError = formState && !formState.success ? (formState.error || formState.message) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md  overflow-hidden p-0 gap-0 max-h-[90vh] flex flex-col"
      >
        <DialogHeader className="px-6 py-4 border-b border-border/20 shrink-0">
          <DialogTitle>Alterar Responsável</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 [scrollbar-width:thin]">
      <form id="alterar-responsavel-processo-form" action={formAction} className={cn("stack-default")}>
        <input
          type="hidden"
          name="responsavelId"
          value={responsavelId === 'null' || responsavelId === '' ? '' : responsavelId}
        />
        <div className={cn("stack-tight")}>
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
            <Text variant="caption" className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium text-destructive")}>{generalError}</Text>
          )}
        </div>
      </form>
        </div>
        <div className="px-6 py-4 border-t border-border/20 shrink-0 flex items-center justify-between gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              disabled={isPending}
              form="alterar-responsavel-processo-form"
            >
              {isPending && <LoadingSpinner className="mr-2" />}
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
