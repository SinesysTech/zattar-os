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

interface UploadDeclaracaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parcelaId: number;
  onSuccess?: () => void;
}

export function UploadDeclaracaoDialog({
  open,
  onOpenChange,
  parcelaId,
  onSuccess,
}: UploadDeclaracaoDialogProps) {
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
      // Por enquanto, vamos apenas simular o upload e salvar o nome do arquivo

      const formData = new FormData();
      formData.append('file', file);
      formData.append('parcelaId', parcelaId.toString());

      // Aqui você implementaria a chamada à API real
      // const response = await fetch('/api/repasses/anexar-declaracao', {
      //   method: 'POST',
      //   body: formData,
      // });

      // Por enquanto, simulamos sucesso após 1 segundo
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success('Declaração anexada com sucesso');

      // Limpar estado
      setFile(null);
      onOpenChange(false);

      // Notificar sucesso
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao anexar declaração');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Anexar Declaração de Prestação de Contas</DialogTitle>
          <DialogDescription>
            Faça upload da declaração de prestação de contas assinada pelo cliente.
            Arquivos permitidos: PDF, JPG, PNG (máx. 5MB)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="file">Arquivo</Label>
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
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 p-3 rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-medium mb-1">Importante</p>
              <p>
                A declaração deve estar assinada pelo cliente, confirmando o recebimento
                do valor e autorizando a transferência dos honorários ao escritório.
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
                Anexar Declaração
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
