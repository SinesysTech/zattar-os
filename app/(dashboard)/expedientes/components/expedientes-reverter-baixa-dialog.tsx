'use client';

// Componente de diálogo para reverter baixa de expediente

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, AlertTriangle } from 'lucide-react';
import type { PendenteManifestacao } from '@/backend/types/pendentes/types';

interface ExpedientesReverterBaixaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expediente: PendenteManifestacao | null;
  onSuccess: () => void;
}

export function ExpedientesReverterBaixaDialog({
  open,
  onOpenChange,
  expediente,
  onSuccess,
}: ExpedientesReverterBaixaDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Resetar estado quando abrir/fechar
  React.useEffect(() => {
    if (!open) {
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!expediente) {
      setError('Expediente não encontrado');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/pendentes-manifestacao/${expediente.id}/reverter-baixa`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Erro desconhecido',
        }));
        throw new Error(
          errorData.error || `Erro ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Erro ao reverter baixa');
      }

      // Sucesso
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao reverter baixa';
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
          <DialogTitle>Reverter Baixa de Expediente</DialogTitle>
          <DialogDescription>
            Reverter a baixa deste expediente, marcando-o como pendente novamente.
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
              {expediente.baixado_em && (
                <div>
                  <span className="font-medium">Baixado em:</span>{' '}
                  {new Date(expediente.baixado_em).toLocaleString('pt-BR')}
                </div>
              )}
              {expediente.protocolo_id && (
                <div>
                  <span className="font-medium">Protocolo:</span> {expediente.protocolo_id}
                </div>
              )}
              {expediente.justificativa_baixa && (
                <div>
                  <span className="font-medium">Justificativa:</span>{' '}
                  {expediente.justificativa_baixa}
                </div>
              )}
            </div>
          </div>

          {/* Aviso */}
          <div className="flex items-start gap-3 rounded-lg border border-warning bg-warning/10 p-4">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-warning mb-1">Atenção</div>
              <div className="text-muted-foreground">
                Ao reverter a baixa, o expediente voltará a aparecer na lista de pendentes.
                Os dados de protocolo e justificativa serão removidos, mas a ação será registrada
                nos logs do sistema.
              </div>
            </div>
          </div>

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
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reverter Baixa
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

