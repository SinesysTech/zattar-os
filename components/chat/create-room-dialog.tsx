'use client';

/**
 * Dialog para criar nova sala de chat
 */

import * as React from 'react';
import { Loader2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateRoomDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateRoomDialogProps) {
  const [loading, setLoading] = React.useState(false);
  const [nome, setNome] = React.useState('');
  const [tipo, setTipo] = React.useState<'privado'>('privado');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/chat/salas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          tipo,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao criar sala');
      }

      toast.success(`Sala "${nome}" criada com sucesso`);

      // Resetar form
      setNome('');
      setTipo('privado');
      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao criar sala:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar sala');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar nova sala de chat</DialogTitle>
          <DialogDescription>
            Crie uma sala privada para conversar com sua equipe
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da sala *</Label>
              <Input
                id="nome"
                placeholder="Ex: Equipe de Recursos Humanos"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select
                value={tipo}
                onValueChange={(v) => setTipo(v as 'privado')}
                disabled={loading}
              >
                <SelectTrigger id="tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="privado">Privado</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Salas privadas são visíveis para todos os usuários autenticados
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Sala
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
