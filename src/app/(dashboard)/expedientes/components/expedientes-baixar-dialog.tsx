'use client';

// Componente de diálogo para baixar expediente

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Textarea será criado como componente simples
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import type { PendenteManifestacao } from '@/backend/types/expedientes/types';

interface ExpedientesBaixarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expediente: PendenteManifestacao | null;
  onSuccess: () => void;
}

export function ExpedientesBaixarDialog({
  open,
  onOpenChange,
  expediente,
  onSuccess,
}: ExpedientesBaixarDialogProps) {
  const [protocoloId, setProtocoloId] = React.useState<string>('');
  const [justificativa, setJustificativa] = React.useState<string>('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [modo, setModo] = React.useState<'protocolo' | 'justificativa'>('protocolo');

  // Resetar formulário quando abrir/fechar
  React.useEffect(() => {
    if (!open) {
      setProtocoloId('');
      setJustificativa('');
      setError(null);
      setModo('protocolo');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!expediente) {
      setError('Expediente não encontrado');
      return;
    }

    // Validação: protocoloId OU justificativa deve estar preenchido
    // (protocolo aceita letras e números)
    if (modo === 'protocolo' && !protocoloId.trim()) {
      setError('É necessário informar o ID do protocolo');
      return;
    }

    if (modo === 'justificativa' && !justificativa.trim()) {
      setError('É necessário informar a justificativa da baixa');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/pendentes-manifestacao/${expediente.id}/baixa`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          protocolo_id: modo === 'protocolo' ? protocoloId.trim() : null,
          justificativa: modo === 'justificativa' ? justificativa.trim() : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Erro ao baixar expediente');
      }

      // Sucesso
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao baixar expediente';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!expediente) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Baixar Expediente</DialogTitle>
          <DialogDescription>
            Marque este expediente como respondido. Informe o ID do protocolo ou a justificativa da baixa.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Informações do expediente */}
          <div className="space-y-2 rounded-lg border p-4 bg-muted/50">
            <div className="text-sm font-medium">Expediente</div>
            <div className="text-sm space-y-1">
              <div>
                <span className="font-medium">Processo:</span> {expediente.numero_processo}
              </div>
              <div>
                <span className="font-medium">Parte Autora:</span> {expediente.nome_parte_autora}
              </div>
              <div>
                <span className="font-medium">Parte Ré:</span> {expediente.nome_parte_re}
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
              <Label htmlFor="protocolo_id">ID do Protocolo *</Label>
              <Input
                id="protocolo_id"
                type="text"
                placeholder="Ex: ABC12345"
                value={protocoloId}
                onChange={(e) => setProtocoloId(e.target.value)}
                disabled={isSubmitting}
                required
              />
              <p className="text-xs text-muted-foreground">
                Informe o ID do protocolo da peça protocolada em resposta ao expediente (pode conter números e letras).
              </p>
            </div>
          )}

          {/* Campo de justificativa */}
          {modo === 'justificativa' && (
            <div className="space-y-2">
              <Label htmlFor="justificativa">Justificativa da Baixa *</Label>
              <textarea
                id="justificativa"
                placeholder="Ex: Expediente resolvido extrajudicialmente..."
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                disabled={isSubmitting}
                rows={4}
                required
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="text-xs text-muted-foreground">
                Informe o motivo pelo qual o expediente está sendo baixado sem protocolo de peça.
              </p>
            </div>
          )}

          {/* Mensagem de erro */}
          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Baixar Expediente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

