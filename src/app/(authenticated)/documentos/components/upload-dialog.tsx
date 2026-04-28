'use client';

/**
 * Dialog para upload de arquivos em documentos
 */

import { cn } from '@/lib/utils';
import * as React from 'react';
import { Upload, File, X} from 'lucide-react';
import { Text } from '@/components/ui/typography';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { actionUploadArquivo } from '../actions/uploads-actions';

import { LoadingSpinner } from "@/components/ui/loading-state"
interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentoId: number;
  onSuccess?: (url: string) => void;
}

export function UploadDialog({
  open,
  onOpenChange,
  documentoId,
  onSuccess,
}: UploadDialogProps) {
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho (50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error('Arquivo muito grande (máximo 50MB)');
        return;
      }

      setSelectedFile(file);

      // Criar preview para imagens
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('documento_id', String(documentoId));

      // Simular progresso (já que não temos progresso real do fetch)
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const result = await actionUploadArquivo(formData);

      clearInterval(progressInterval);
      setProgress(100);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao fazer upload');
      }

      toast.success('Arquivo enviado com sucesso');

      // Resetar
      setSelectedFile(null);
      setProgress(0);
      onOpenChange(false);

      if (onSuccess && result.data?.b2_url) {
        onSuccess(result.data.b2_url);
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer upload');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(/* design-system-escape: p-0 gap-0 → usar <Inset> */ "sm:max-w-lg glass-dialog overflow-hidden p-0 gap-0 max-h-[90vh] flex flex-col")}
      >
        <DialogHeader className={cn(/* design-system-escape: px-6 py-4 → usar <Inset> */ "px-6 py-4 border-b border-border/20 shrink-0")}>
          <DialogTitle>Upload de arquivo</DialogTitle>
          <DialogDescription>
            Faça upload de imagens, PDFs ou outros arquivos para este documento
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4")}>
            {!selectedFile ? (
              <div
                className={cn(/* design-system-escape: p-6 → migrar para <Inset variant="dialog">; sm:p-8 sem equivalente DS */ "border-2 border-dashed rounded-lg p-6 sm:p-8 text-center cursor-pointer hover:bg-accent transition-colors")}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                <p className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-medium → className de <Text>/<Heading> */ "mt-3 sm:mt-4 text-sm font-medium")}>
                  Clique para selecionar um arquivo
                </p>
                <p className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "mt-1 text-xs text-muted-foreground")}>
                  Máximo 50MB • Imagens, PDFs, documentos
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                  aria-label="Selecionar arquivo para upload"
                />
              </div>
            ) : (
              <div className={cn(/* design-system-escape: p-3 → usar <Inset>; sm:p-4 sem equivalente DS; space-y-3 sem token DS */ "border rounded-lg p-3 sm:p-4 space-y-3")}>
                {previewUrl && (
                  <div className="relative w-full aspect-video rounded-md overflow-hidden bg-muted">
                    { }
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center justify-between gap-2")}>
                  <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; sm:gap-3 sem equivalente DS */ "flex items-center gap-2 sm:gap-3 flex-1 min-w-0")}>
                    <File className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; text-sm → migrar para <Text variant="body-sm">; sm:text-base sem equivalente DS */ "font-medium truncate text-sm sm:text-base")}>{selectedFile.name}</p>
                      <p className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption">; sm:text-sm sem equivalente DS */ "text-xs sm:text-sm text-muted-foreground")}>
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon" aria-label="Fechar"
                    onClick={handleRemoveFile}
                    disabled={uploading}
                    className="h-8 w-8 sm:h-10 sm:w-10 shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {uploading && (
                  <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "mt-3 sm:mt-4 space-y-2")}>
                    <div className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption">; sm:text-sm sem equivalente DS */ "flex items-center justify-between text-xs sm:text-sm")}>
                      <Text variant="caption" as="span" className="text-muted-foreground">Enviando...</Text>
                      <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium")}>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogBody>

        <div className={cn(/* design-system-escape: px-6 py-4 → usar <Inset> */ "px-6 py-4 border-t border-border/20 shrink-0 flex items-center justify-between gap-2")}>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
          >
            Cancelar
          </Button>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
            >
              {uploading ? (
                <>
                  <LoadingSpinner className="mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Enviar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
