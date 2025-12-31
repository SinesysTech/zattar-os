'use client';

// Dialog para edição de capa/banner do perfil do usuário

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { actionUploadCover, actionRemoverCover } from '../../actions/cover-actions';
import { Upload, X, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoverEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuarioId: number;
  coverUrl: string | null;
  onSuccess: () => void;
}

export function CoverEditDialog({
  open,
  onOpenChange,
  usuarioId,
  coverUrl,
  onSuccess,
}: CoverEditDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentCoverUrl, setCurrentCoverUrl] = React.useState(coverUrl);
  const [preview, setPreview] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Atualizar URL quando prop mudar
  React.useEffect(() => {
    setCurrentCoverUrl(coverUrl);
  }, [coverUrl]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validação de tipo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.');
      return;
    }

    // Validação de tamanho
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Tamanho máximo: 10MB');
      return;
    }

    // Criar preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await actionUploadCover(usuarioId, formData);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao fazer upload');
      }

      // Atualizar URL local
      setCurrentCoverUrl(result.data as string);
      setPreview(null);

      toast.success('Imagem de capa atualizada com sucesso.');

      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer upload';
      toast.error(errorMessage);
      setPreview(null);
    } finally {
      setIsLoading(false);
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    setIsLoading(true);

    try {
      const result = await actionRemoverCover(usuarioId);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao remover capa');
      }

      // Limpar URL local
      setCurrentCoverUrl(null);
      setPreview(null);

      toast.success('Imagem de capa removida.');

      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao remover capa';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const displayUrl = preview || currentCoverUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Imagem de Capa</DialogTitle>
          <DialogDescription>
            Faça upload de uma nova imagem de capa ou remova a atual. Dimensões recomendadas: 1200x300px.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview da capa */}
          <div
            className={cn(
              'relative w-full h-48 rounded-lg overflow-hidden border-2 border-dashed',
              displayUrl ? 'border-transparent' : 'border-muted-foreground/25 bg-muted/50'
            )}
          >
            {displayUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={displayUrl}
                  alt="Capa do perfil"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={triggerFileInput}
                    disabled={isLoading}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Alterar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleRemove}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remover
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <Camera className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma imagem de capa</p>
              </div>
            )}
          </div>

          {/* Input de arquivo */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Botões de ação */}
          <div className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              Formatos: JPEG, PNG, WebP • Máx: 10MB
            </div>
            <div className="flex gap-2">
              {!displayUrl && (
                <Button
                  onClick={triggerFileInput}
                  disabled={isLoading}
                  variant="default"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isLoading ? 'Enviando...' : 'Enviar Imagem'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
