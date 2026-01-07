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

import type { TribunalConfigDb } from '@/features/captura';

type Props = {
  tribunal: TribunalConfigDb | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

/**
 * Dialog mínimo para editar configurações do tribunal (UI placeholder).
 * A persistência real deve ser feita via rota `/api/captura/tribunais` (PUT/POST).
 */
export function TribunaisDialog({ tribunal, open, onOpenChange, onSuccess }: Props) {
  const [urlBase, setUrlBase] = React.useState('');
  const [urlApi, setUrlApi] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    setUrlBase(tribunal?.url_base ?? '');
    setUrlApi(tribunal?.url_api ?? '');
  }, [tribunal]);

  const handleSave = async () => {
    if (!tribunal) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/captura/tribunais/${tribunal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url_base: urlBase,
          url_api: urlApi,
        }),
      });

      const json: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          json && typeof json === 'object' && 'error' in json && typeof (json as { error?: unknown }).error === 'string'
            ? (json as { error: string }).error
            : 'Erro ao salvar tribunal';
        throw new Error(msg);
      }

      toast.success('Tribunal atualizado');
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
          <DialogTitle>Editar tribunal</DialogTitle>
          <DialogDescription>
            {tribunal ? `${tribunal.tribunal_codigo} — ${tribunal.tribunal_nome}` : 'Selecione um tribunal'}
          </DialogDescription>
        </DialogHeader>

        {!tribunal ? (
          <div className="text-sm text-muted-foreground">Nenhum tribunal selecionado.</div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>URL base</Label>
              <Input value={urlBase} onChange={(e) => setUrlBase(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>URL API</Label>
              <Input value={urlApi} onChange={(e) => setUrlApi(e.target.value)} />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !tribunal}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


