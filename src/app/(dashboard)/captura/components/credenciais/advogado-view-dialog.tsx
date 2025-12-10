'use client';

import { useEffect, useState } from 'react';
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
import { Spinner } from '@/components/ui/spinner';
import { useAdvogado } from '@/app/_lib/hooks/use-advogado';
import { toast } from 'sonner';
import type { Credencial } from '@/app/_lib/types/credenciais';

interface AdvogadoViewDialogProps {
  credencial: Credencial | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog para visualizar e editar informações do advogado
 */
export function AdvogadoViewDialog({ credencial, open, onOpenChange }: AdvogadoViewDialogProps) {
  const { advogado, isLoading, buscarAdvogado, atualizarAdvogado } = useAdvogado();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Estados do formulário
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [cpf, setCpf] = useState('');
  const [oab, setOab] = useState('');
  const [ufOab, setUfOab] = useState('');

  // Buscar advogado quando o dialog abrir
  useEffect(() => {
    if (open && credencial) {
      buscarAdvogado(credencial.advogado_id);
    }
  }, [open, credencial, buscarAdvogado]);

  // Atualizar formulário quando advogado carregar
  useEffect(() => {
    if (advogado) {
      setNomeCompleto(advogado.nome_completo);
      setCpf(advogado.cpf);
      setOab(advogado.oab);
      setUfOab(advogado.uf_oab);
    }
  }, [advogado]);

  const handleSave = async () => {
    if (!advogado) return;

    setIsSaving(true);
    try {
      await atualizarAdvogado(advogado.id, {
        nome_completo: nomeCompleto,
        cpf,
        oab,
        uf_oab: ufOab,
      });

      toast.success('Advogado atualizado com sucesso!');

      setIsEditing(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar advogado');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (advogado) {
      setNomeCompleto(advogado.nome_completo);
      setCpf(advogado.cpf);
      setOab(advogado.oab);
      setUfOab(advogado.uf_oab);
    }
    setIsEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Informações do Advogado</DialogTitle>
          <DialogDescription>
            Visualize ou edite as informações cadastrais do advogado
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="h-8 w-8" />
          </div>
        ) : advogado ? (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome_completo">Nome Completo</Label>
              <Input
                id="nome_completo"
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="oab">OAB</Label>
                <Input
                  id="oab"
                  value={oab}
                  onChange={(e) => setOab(e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="uf_oab">UF OAB</Label>
                <Input
                  id="uf_oab"
                  value={ufOab}
                  onChange={(e) => setUfOab(e.target.value.toUpperCase())}
                  maxLength={2}
                  disabled={!isEditing}
                />
              </div>
            </div>

            {/* Informações adicionais (read-only) */}
            <div className="border-t pt-4 mt-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">Criado em</Label>
                  <p className="mt-1">
                    {new Date(advogado.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Atualizado em</Label>
                  <p className="mt-1">
                    {new Date(advogado.updated_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Advogado não encontrado
          </div>
        )}

        <DialogFooter>
          {!isEditing ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
              <Button onClick={() => setIsEditing(true)} disabled={!advogado}>
                Editar
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Spinner className="mr-2" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
