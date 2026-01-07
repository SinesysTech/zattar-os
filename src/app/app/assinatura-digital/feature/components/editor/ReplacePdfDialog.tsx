'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { AlertCircle, Check, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import PdfPreviewDynamic from '../pdf/PdfPreviewDynamic';
const PdfPreview = PdfPreviewDynamic;

interface ReplacePdfDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string | number;
  onSuccess: () => void;
}

interface UploadedFile {
  file: File;
  preview: string;
  isValid: boolean;
  error?: string;
}

export default function ReplacePdfDialog({
  open,
  onOpenChange,
  templateId,
  onSuccess,
}: ReplacePdfDialogProps) {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validação de arquivo PDF
  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    // Verificar tipo
    if (file.type !== 'application/pdf') {
      return { isValid: false, error: 'Apenas arquivos PDF são aceitos' };
    }

    // Verificar tamanho (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { isValid: false, error: 'Arquivo muito grande. Máximo 10MB' };
    }

    // Verificar tamanho mínimo (10KB)
    const minSize = 10 * 1024; // 10KB
    if (file.size < minSize) {
      return { isValid: false, error: 'Arquivo muito pequeno. Mínimo 10KB' };
    }

    return { isValid: true };
  }, []);

  // Configuração do dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const validation = validateFile(file);

    // Criar URL do blob para preview
    const blobUrl = URL.createObjectURL(file);

    const uploadedFile: UploadedFile = {
      file,
      preview: blobUrl,
      isValid: validation.isValid,
      error: validation.error
    };

    setUploadedFile(uploadedFile);

    if (!validation.isValid && validation.error) {
      toast.error(validation.error);
    }
  }, [validateFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    multiple: false
  });

  // Remover arquivo
  const removeFile = useCallback(() => {
    if (uploadedFile?.preview) {
      URL.revokeObjectURL(uploadedFile.preview);
    }
    setUploadedFile(null);
  }, [uploadedFile]);

  // Cleanup: revogar URL do blob quando componente desmonta ou dialog fecha
  useEffect(() => {
    return () => {
      if (uploadedFile?.preview) {
        URL.revokeObjectURL(uploadedFile.preview);
      }
    };
  }, [uploadedFile]);

  // Reset ao fechar
  useEffect(() => {
    if (!open) {
      removeFile();
    }
  }, [open, removeFile]);

  const handleReplace = async () => {
    if (!uploadedFile || !uploadedFile.isValid) {
      toast.error('Selecione um arquivo PDF válido');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile.file);

      const response = await fetch(`/api/assinatura-digital/admin/templates/${templateId}/replace-pdf`, {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      });

      if (response.status === 401) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao substituir PDF do template');
      }

      toast.success('PDF substituído com sucesso!');
      removeFile();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao substituir PDF:', error);
      toast.error(
        error instanceof Error ? error.message : 'Erro ao substituir PDF do template'
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Substituir PDF do Template</DialogTitle>
          <DialogDescription>
            Faça upload de um novo arquivo PDF. O arquivo atual será substituído permanentemente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-auto py-4">
          {/* Upload de Novo PDF */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Novo PDF</h4>
              {uploadedFile && (
                <span className="text-xs text-muted-foreground">
                  {uploadedFile.file.name} • {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              )}
            </div>

            {!uploadedFile ? (
              <div className="flex-1 min-h-[400px] flex items-center justify-center">
                <div
                  {...getRootProps()}
                  className={`w-full h-full border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors flex flex-col items-center justify-center ${
                    isDragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-input hover:border-primary/50'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input {...getInputProps()} ref={fileInputRef} className="hidden" />
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm font-medium mb-1">
                    {isDragActive ? 'Solte o arquivo aqui' : 'Arraste um PDF ou clique para selecionar'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Apenas arquivos PDF, máximo 10MB
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Indicador de arquivo selecionado */}
                <div className="border rounded-lg p-3 bg-card">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={`shrink-0 p-1.5 rounded-full ${
                        uploadedFile.isValid
                          ? 'bg-success/10'
                          : 'bg-destructive/10'
                      }`}>
                        {uploadedFile.isValid ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{uploadedFile.file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        {!uploadedFile.isValid && uploadedFile.error && (
                          <p className="text-xs text-destructive mt-0.5">{uploadedFile.error}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Preview do novo PDF */}
                {uploadedFile.isValid && (
                  <div className="flex-1 min-h-[350px] bg-muted/30 rounded-lg overflow-hidden">
                    <PdfPreview
                      pdfUrl={uploadedFile.preview}
                      initialZoom={0.8}
                      showControls={true}
                      showPageIndicator={true}
                      maxHeight="100%"
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      onLoadError={(error) => {
                        toast.error(`Erro ao carregar preview: ${error.message}`);
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <DialogFooter className="shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleReplace}
            disabled={!uploadedFile || !uploadedFile.isValid || isUploading}
            className="gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Substituindo...
              </>
            ) : (
              'Substituir PDF'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}