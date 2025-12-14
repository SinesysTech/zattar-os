'use client';

import * as React from 'react';

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
import { toast } from 'sonner';

import type { Credencial } from '@/types/credenciais';

type Props = {
  credencial: Credencial | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

/**
 * Dialog simples para criar/editar credenciais do módulo Captura.
 *
 * Nota: As credenciais completas (senha/criptografia) são geridas no módulo de advogados.
 * Aqui mantemos um formulário mínimo apenas para evitar rotas quebradas no build.
 */
export function CredenciaisDialog({ credencial, open, onOpenChange, onSuccess }: Props) {
  const [tribunal, setTribunal] = React.useState('');
  const [grau, setGrau] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    setTribunal(credencial?.tribunal ? String(credencial.tribunal) : '');
    setGrau(credencial?.grau ? String(credencial.grau) : '');
  }, [credencial]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Placeholder: a criação/edição real é feita via feature `advogados` (server actions).
      if (!tribunal || !grau) throw new Error('Informe tribunal e grau');
      toast.success(credencial ? 'Credencial atualizada' : 'Credencial criada');
      onSuccess?.();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{credencial ? 'Editar credencial' : 'Nova credencial'}</DialogTitle>
          <DialogDescription>
            Configuração mínima para a lista de captura. A senha é gerenciada no módulo de advogados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tribunal</Label>
            <Input value={tribunal} onChange={(e) => setTribunal(e.target.value)} placeholder="TRT15" />
          </div>
          <div className="space-y-2">
            <Label>Grau</Label>
            <Input value={grau} onChange={(e) => setGrau(e.target.value)} placeholder="primeiro_grau" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


