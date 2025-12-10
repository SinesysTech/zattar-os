'use client';

import { useState } from 'react';
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
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Typography } from '@/components/ui/typography';

interface UploadComprovanteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parcelaId: number;
  valorRepasse: number;
  onSuccess?: () => void;
}

export function UploadComprovanteDialog({
  open,
  onOpenChange,
  parcelaId,
  valorRepasse,
  onSuccess,
}: UploadComprovanteDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validar tipo de arquivo
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('Apenas arquivos PDF, JPG ou PNG são permitidos');
        return;
      }

      // Validar tamanho (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (selectedFile.size > maxSize) {
        toast.error('O arquivo deve ter no máximo 5MB');
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Selecione um arquivo');
      return;
    }

    try {
      setIsUploading(true);

      // TODO: Implementar upload para storage (Minio/S3)
      // Por enquanto, vamos apenas simular o upload

      const formData = new FormData();
      formData.append('file', file);
      formData.append('parcelaId', parcelaId.toString());

      // Aqui você implementaria a chamada à API real
      // const response = await fetch('/api/repasses/realizar-repasse', {
      //   method: 'POST',
      //   body: formData,
      // });

      // Por enquanto, simulamos sucesso após 1 segundo
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success('Comprovante de repasse anexado com sucesso');

      // Limpar estado
      setFile(null);
      onOpenChange(false);

      // Notificar sucesso
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao anexar comprovante');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    onOpenChange(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Realizar Repasse ao Cliente</DialogTitle>
          <DialogDescription>
            Faça upload do comprovante de transferência bancária.
            Arquivos permitidos: PDF, JPG, PNG (máx. 5MB)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 rounded-md bg-muted">
            <div className="flex items-center justify-between">
              <Typography.Muted as="span">Valor do Repasse:</Typography.Muted>
              <span className="text-lg font-semibold">{formatCurrency(valorRepasse)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Comprovante de Transferência</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </div>
          </div>

          {file && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <Typography.Small className="font-medium truncate">{file.name}</Typography.Small>
                <Typography.Muted className="text-xs">
                  {(file.size / 1024).toFixed(2)} KB
                </Typography.Muted>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-900 dark:text-amber-100">
              <p className="font-medium mb-1">Atenção</p>
              <p>
                Certifique-se de que a transferência foi realizada antes de anexar o
                comprovante. Após confirmar, o repasse será marcado como concluído.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isUploading}>
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-pulse" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Confirmar Repasse
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
