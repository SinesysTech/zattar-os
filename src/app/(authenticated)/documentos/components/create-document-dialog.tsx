'use client';

/**
 * Dialog para criar novo documento
 */

import {
  cn } from '@/lib/utils';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { actionCriarDocumento } from '../actions/documentos-actions';

import { LoadingSpinner } from "@/components/ui/loading-state"
interface CreateDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pastaId?: number | null;
  onSuccess?: () => void;
}

export function CreateDocumentDialog({
  open,
  onOpenChange,
  pastaId,
  onSuccess,
}: CreateDocumentDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [titulo, setTitulo] = React.useState('');
  const [descricao, setDescricao] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titulo.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('titulo', titulo.trim());
      if (descricao.trim()) formData.append('descricao', descricao.trim());
      if (pastaId) formData.append('pasta_id', pastaId.toString());
      formData.append('conteudo', JSON.stringify([]));

      const result = await actionCriarDocumento(formData);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao criar documento');
      }

      toast.success('Documento criado', { description: 'Abrindo editor...' });

      // Resetar form
      setTitulo('');
      setDescricao('');
      onOpenChange(false);

      // Redirecionar para editor
      router.push(`/documentos/${result.data.id}`);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao criar documento:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar documento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(/* design-system-escape: p-0 gap-0 → usar <Inset> */ "sm:max-w-lg  overflow-hidden p-0 gap-0 max-h-[90vh] flex flex-col")}
      >
        <DialogHeader className={cn(/* design-system-escape: px-6 py-4 → usar <Inset> */ "px-6 py-4 border-b border-border/20 shrink-0")}>
          <DialogTitle>Criar novo documento</DialogTitle>
          <DialogDescription>
            Crie um novo documento jurídico. Você será redirecionado para o editor.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 [scrollbar-width:thin]">
            <div className={cn("stack-default")}>
              <div className={cn("stack-tight")}>
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  placeholder="Ex: Petição Inicial - Processo 1234"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div className={cn("stack-tight")}>
                <Label htmlFor="descricao">Descrição (opcional)</Label>
                <Textarea
                  id="descricao"
                  placeholder="Breve descrição do documento..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  disabled={loading}
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className={cn(/* design-system-escape: px-6 py-4 → usar <Inset> */ "px-6 py-4 border-t border-border/20 shrink-0 flex items-center justify-between gap-2")}>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <div className="flex items-center gap-2">
              <Button type="submit" disabled={loading}>
                {loading && <LoadingSpinner className="mr-2" />}
                Criar e Editar
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
