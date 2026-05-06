'use client';

import {
  cn } from '@/lib/utils';
import * as React from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import type { Pericia } from '../domain';
import { actionAdicionarObservacao } from '../actions/pericias-actions';

interface PericiaObservacoesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pericia: Pericia | null;
  onSuccess?: () => void;
}

export function PericiaObservacoesDialog({
  open,
  onOpenChange,
  pericia,
  onSuccess,
}: PericiaObservacoesDialogProps) {
  const [observacoes, setObservacoes] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setObservacoes(pericia?.observacoes || '');
    setError(null);
    setIsSaving(false);
  }, [open, pericia]);

  const handleSave = async () => {
    if (!pericia) return;
    setIsSaving(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('periciaId', String(pericia.id));
      formData.append('observacoes', observacoes);

      const result = await actionAdicionarObservacao(formData);
      if (!result.success) {
        throw new Error(result.message || 'Erro ao atualizar observações.');
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md  overflow-hidden p-0 gap-0 max-h-[90vh] flex flex-col"
      >
        <DialogHeader className="px-6 py-4 border-b border-border/20 shrink-0">
          <DialogTitle>Observações</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 [scrollbar-width:thin]">
          <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "grid grid-cols-1 gap-3")}>
            <Textarea
              value={observacoes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setObservacoes(e.target.value)
              }
              placeholder="Adicione observações sobre a perícia..."
              className="min-h-35ne"
              disabled={isSaving}
            />
            {error && <div className={cn("text-body-sm text-destructive")}>{error}</div>}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border/20 shrink-0 flex items-center justify-between gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancelar</Button>
          <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={isSaving || !pericia}>
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
