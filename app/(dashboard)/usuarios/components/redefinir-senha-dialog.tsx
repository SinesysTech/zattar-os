'use client';

// Componente Dialog para redefinição de senha de usuário (admin)

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
import { Loader2, Eye, EyeOff } from 'lucide-react';
import type { Usuario } from '@/backend/usuarios/services/persistence/usuario-persistence.service';

interface RedefinirSenhaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: Usuario | null;
  onSuccess: () => void;
}

export function RedefinirSenhaDialog({
  open,
  onOpenChange,
  usuario,
  onSuccess,
}: RedefinirSenhaDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Form state
  const [novaSenha, setNovaSenha] = React.useState('');
  const [confirmarSenha, setConfirmarSenha] = React.useState('');

  // Show/hide password
  const [showNovaSenha, setShowNovaSenha] = React.useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = React.useState(false);

  // Reset form when dialog closes or usuario changes
  React.useEffect(() => {
    if (!open) {
      setNovaSenha('');
      setConfirmarSenha('');
      setError(null);
      setSuccessMessage(null);
      setShowNovaSenha(false);
      setShowConfirmarSenha(false);
    }
  }, [open]);

  const validateForm = (): string | null => {
    if (!novaSenha) {
      return 'Nova senha é obrigatória';
    }

    if (novaSenha.length < 8) {
      return 'Senha deve ter no mínimo 8 caracteres';
    }

    if (novaSenha.length > 72) {
      return 'Senha deve ter no máximo 72 caracteres';
    }

    if (novaSenha !== confirmarSenha) {
      return 'As senhas não coincidem';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!usuario) {
      setError('Usuário não selecionado');
      return;
    }

    setError(null);
    setSuccessMessage(null);

    // Validar formulário
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/usuarios/${usuario.id}/senha`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ novaSenha }),
      });

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
        throw new Error(data.error || 'Resposta da API indicou falha');
      }

      setSuccessMessage('Senha redefinida com sucesso!');

      // Aguardar 1.5s para mostrar mensagem de sucesso
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
      }, 1500);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao redefinir senha';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!usuario) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
            <DialogDescription>
              Digite a nova senha para o usuário <strong>{usuario.nomeExibicao}</strong>.
              A senha deve ter no mínimo 8 caracteres.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="rounded-md bg-green-500/15 p-3 text-sm text-green-700 dark:text-green-400">
                {successMessage}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="novaSenha">Nova Senha *</Label>
              <div className="relative">
                <Input
                  id="novaSenha"
                  type={showNovaSenha ? 'text' : 'password'}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Digite a nova senha"
                  required
                  disabled={isLoading || !!successMessage}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNovaSenha(!showNovaSenha)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isLoading || !!successMessage}
                >
                  {showNovaSenha ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Mínimo de 8 caracteres, máximo de 72
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmarSenha">Confirmar Nova Senha *</Label>
              <div className="relative">
                <Input
                  id="confirmarSenha"
                  type={showConfirmarSenha ? 'text' : 'password'}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Digite novamente a nova senha"
                  required
                  disabled={isLoading || !!successMessage}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isLoading || !!successMessage}
                >
                  {showConfirmarSenha ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading || !!successMessage}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !!successMessage}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Redefinir Senha
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
