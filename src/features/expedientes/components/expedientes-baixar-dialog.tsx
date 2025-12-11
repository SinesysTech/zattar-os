'use client';

// Componente de diálogo para baixar expediente

import * as React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { actionBaixarExpediente } from '../actions';
import { Expediente } from '../types';

interface ExpedientesBaixarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expediente: Expediente | null;
  onSuccess: () => void;
}

const initialState = {
  success: false,
  message: '',
  error: '',
  errors: undefined,
};

export function ExpedientesBaixarDialog({
  open,
  onOpenChange,
  expediente,
  onSuccess,
}: ExpedientesBaixarDialogProps) {
  const [modo, setModo] = React.useState<'protocolo' | 'justificativa'>('protocolo');
  const [formState, formAction] = useFormState(
    actionBaixarExpediente.bind(null, expediente?.id || 0),
    initialState
  );
  const { pending } = useFormStatus();

  React.useEffect(() => {
    if (!open) {
      setModo('protocolo');
    }
  }, [open]);

  React.useEffect(() => {
    if (formState.success) {
      onSuccess();
      onOpenChange(false);
    }
  }, [formState.success, onSuccess, onOpenChange]);

  if (!expediente) {
    return null;
  }

  // Determine if there's a general error message or a specific field error
  const generalError = formState.error || (formState.message && formState.success === false ? formState.message : null);
  const protocoloIdError = formState.errors?.protocoloId?.[0];
  const justificativaBaixaError = formState.errors?.justificativaBaixa?.[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Baixar Expediente</DialogTitle>
          <DialogDescription>
            Marque este expediente como respondido. Informe o ID do protocolo ou a justificativa da baixa.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="mt-6 space-y-6">
          {/* Informações do expediente */}
          <div className="space-y-2 rounded-lg border p-4 bg-muted/50">
            <div className="text-sm font-medium">Expediente</div>
            <div className="text-sm space-y-1">
              <div>
                <span className="font-medium">Processo:</span> {expediente.numeroProcesso}
              </div>
              <div>
                <span className="font-medium">Parte Autora:</span> {expediente.nomeParteAutora}
              </div>
              <div>
                <span className="font-medium">Parte Ré:</span> {expediente.nomeParteRe}
              </div>
            </div>
          </div>

          {/* Modo de baixa */}
          <div className="space-y-2">
            <Label>Forma de Baixa</Label>
            <div className="flex gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="modo"
                  value="protocolo"
                  checked={modo === 'protocolo'}
                  onChange={(e) => setModo(e.target.value as 'protocolo')}
                  className="h-4 w-4"
                />
                <span className="text-sm">Com Protocolo</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="modo"
                  value="justificativa"
                  checked={modo === 'justificativa'}
                  onChange={(e) => setModo(e.target.value as 'justificativa')}
                  className="h-4 w-4"
                />
                <span className="text-sm">Sem Protocolo</span>
              </label>
            </div>
          </div>

          {/* Campo de protocolo */}
          {modo === 'protocolo' && (
            <div className="space-y-2">
              <Label htmlFor="protocoloId">ID do Protocolo *</Label>
              <Input
                id="protocoloId"
                name="protocoloId"
                type="text"
                placeholder="Ex: ABC12345"
                disabled={pending}
                required={modo === 'protocolo'}
              />
              {protocoloIdError && (
                <p className="text-sm font-medium text-destructive">{protocoloIdError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Informe o ID do protocolo da peça protocolada em resposta ao expediente (pode conter números e letras).
              </p>
            </div>
          )}

          {/* Campo de justificativa */}
          {modo === 'justificativa' && (
            <div className="space-y-2">
              <Label htmlFor="justificativaBaixa">Justificativa da Baixa *</Label>
              <textarea
                id="justificativaBaixa"
                name="justificativaBaixa"
                placeholder="Ex: Expediente resolvido extrajudicialmente..."
                disabled={pending}
                rows={4}
                required={modo === 'justificativa'}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {justificativaBaixaError && (
                <p className="text-sm font-medium text-destructive">{justificativaBaixaError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Informe o motivo pelo qual o expediente está sendo baixado sem protocolo de peça.
              </p>
            </div>
          )}

          {/* Mensagem de erro */}
          {generalError && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              {generalError}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Baixar Expediente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
