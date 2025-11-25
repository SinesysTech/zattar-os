'use client';

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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Audiencia = {
  id: number;
  observacoes: string | null;
};

interface EditarObservacoesDialogProps {
  audiencia: Audiencia;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditarObservacoesDialog({
  audiencia,
  open,
  onOpenChange,
  onSuccess,
}: EditarObservacoesDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [observacoes, setObservacoes] = React.useState(audiencia.observacoes || '');
  const [error, setError] = React.useState<string | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Reset state when audiencia changes
  React.useEffect(() => {
    setObservacoes(audiencia.observacoes || '');
    setError(null);
  }, [audiencia.observacoes]);

  // Auto-focus textarea when dialog opens
  React.useEffect(() => {
    if (open && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
        // Move cursor to end
        const length = textareaRef.current?.value.length || 0;
        textareaRef.current?.setSelectionRange(length, length);
      }, 100);
    }
  }, [open]);

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const observacoesToSave = observacoes.trim() || null;

      const response = await fetch(`/api/audiencias/${audiencia.id}/observacoes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ observacoes: observacoesToSave }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro ao atualizar observações');
      }

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Erro ao atualizar observações:', error);
      setError(error instanceof Error ? error.message : 'Erro ao salvar observações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setObservacoes(audiencia.observacoes || '');
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(92vw,25rem)] sm:max-w-[min(92vw,37.5rem)]">
        <DialogHeader>
          <DialogTitle>Editar Observações</DialogTitle>
          <DialogDescription>
            Adicione observações sobre a audiência
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="observacoes-textarea">Observações</Label>
            <Textarea
              ref={textareaRef}
              id="observacoes-textarea"
              value={observacoes}
              onChange={(e) => {
                setObservacoes(e.target.value);
                setError(null);
              }}
              placeholder="Digite as observações sobre a audiência..."
              disabled={isLoading}
              className="min-h-[250px] resize-y"
              onKeyDown={(e) => {
                if (e.key === 'Escape') handleCancel();
              }}
            />
            <p className="text-xs text-muted-foreground">
              {observacoes.length} caractere{observacoes.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Mensagem de erro */}
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
