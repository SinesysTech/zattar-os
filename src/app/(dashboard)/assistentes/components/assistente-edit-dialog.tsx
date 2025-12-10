'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { Assistente } from '@/app/_lib/types/assistentes';

interface AssistenteEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assistente: Assistente;
  onSuccess?: () => void;
}

export function AssistenteEditDialog({
  open,
  onOpenChange,
  assistente,
  onSuccess,
}: AssistenteEditDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    iframe_code: '',
    ativo: true,
  });

  // Preencher formulário quando assistente mudar
  useEffect(() => {
    if (assistente) {
      setFormData({
        nome: assistente.nome || '',
        descricao: assistente.descricao || '',
        iframe_code: assistente.iframe_code || '',
        ativo: assistente.ativo,
      });
    }
  }, [assistente]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`/api/assistentes/${assistente.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar assistente');
      }

      toast.success('Assistente atualizado com sucesso!');

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao atualizar assistente:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar assistente. Tente novamente.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Assistente</DialogTitle>
            <DialogDescription>
              Atualize as informações do assistente no sistema.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Nome */}
            <div className="grid gap-2">
              <Label htmlFor="nome">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                required
                maxLength={200}
              />
            </div>

            {/* Descrição */}
            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                maxLength={1000}
                rows={3}
              />
            </div>

            {/* Código do Iframe */}
            <div className="grid gap-2">
              <Label htmlFor="iframe_code">
                Código do Iframe <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="iframe_code"
                value={formData.iframe_code}
                onChange={(e) =>
                  setFormData({ ...formData, iframe_code: e.target.value })
                }
                required
                placeholder='<iframe src="https://example.com" width="100%" height="400"></iframe>'
                rows={5}
              />
            </div>

            {/* Status */}
            <div className="grid gap-2">
              <Label htmlFor="ativo">Status</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, ativo: !!checked })
                  }
                />
                <Label htmlFor="ativo" className="cursor-pointer font-normal">
                  Ativo
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}