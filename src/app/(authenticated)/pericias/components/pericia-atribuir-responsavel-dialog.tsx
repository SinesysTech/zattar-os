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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { Pericia, UsuarioOption } from '../domain';
import { actionAtribuirResponsavel } from '../actions/pericias-actions';

function getUsuarioNome(u: UsuarioOption): string {
  return (
    u.nomeExibicao ||
    u.nome_exibicao ||
    u.nomeCompleto ||
    u.nome ||
    `Usuário ${u.id}`
  );
}

interface PericiaAtribuirResponsavelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pericia: Pericia | null;
  usuarios: UsuarioOption[];
  onSuccess?: () => void;
}

export function PericiaAtribuirResponsavelDialog({
  open,
  onOpenChange,
  pericia,
  usuarios,
  onSuccess,
}: PericiaAtribuirResponsavelDialogProps) {
  const [responsavelId, setResponsavelId] = React.useState<string>('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setResponsavelId(pericia?.responsavelId ? String(pericia.responsavelId) : '');
    setError(null);
    setIsSaving(false);
  }, [open, pericia]);

  const handleSave = async () => {
    if (!pericia) return;
    setIsSaving(true);
    setError(null);

    try {
      const rid = Number(responsavelId);
      if (!rid || Number.isNaN(rid)) {
        throw new Error('Selecione um responsável.');
      }

      const formData = new FormData();
      formData.append('periciaId', String(pericia.id));
      formData.append('responsavelId', String(rid));

      const result = await actionAtribuirResponsavel(formData);
      if (!result.success) {
        throw new Error(result.message || 'Erro ao atribuir responsável.');
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
          <DialogTitle>Atribuir responsável</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 [scrollbar-width:thin]">
          <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "grid grid-cols-1 gap-4")}>
            <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "grid gap-2")}>
              <div className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-body-sm font-medium")}>Responsável</div>
              <Select value={responsavelId || '_none'} onValueChange={setResponsavelId}>
                <SelectTrigger className="w-full bg-card">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none" disabled>
                    Selecione...
                  </SelectItem>
                  {usuarios.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {getUsuarioNome(u)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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


