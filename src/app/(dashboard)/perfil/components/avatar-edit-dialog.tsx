'use client';

// Dialog para edição de avatar do perfil do usuário

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { toast } from 'sonner';

interface AvatarEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuarioId: number;
  avatarUrl: string | null;
  nomeExibicao: string;
  onSuccess: () => void;
}

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AvatarEditDialog({
  open,
  onOpenChange,
  usuarioId,
  avatarUrl,
  nomeExibicao,
  onSuccess,
}: AvatarEditDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentAvatarUrl, setCurrentAvatarUrl] = React.useState(avatarUrl);

  // Atualizar URL quando prop mudar
  React.useEffect(() => {
    setCurrentAvatarUrl(avatarUrl);
  }, [avatarUrl]);

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/usuarios/${usuarioId}/avatar`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer upload');
      }

      // Atualizar URL local
      setCurrentAvatarUrl(data.data.avatarUrl);

      toast.success('Sua foto de perfil foi atualizada com sucesso.');

      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer upload';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/usuarios/${usuarioId}/avatar`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao remover avatar');
      }

      // Limpar URL local
      setCurrentAvatarUrl(null);

      toast.success('Sua foto de perfil foi removida.');

      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao remover avatar';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Foto de Perfil</DialogTitle>
          <DialogDescription>
            Faça upload de uma nova foto ou remova a atual.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-6">
          <AvatarUpload
            avatarUrl={currentAvatarUrl}
            fallbackInitials={getInitials(nomeExibicao)}
            onFileSelect={handleFileSelect}
            onRemove={handleRemove}
            isLoading={isLoading}
            size="lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
