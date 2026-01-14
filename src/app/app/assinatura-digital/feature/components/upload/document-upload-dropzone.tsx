'use client';

import { useCallback } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DialogFormShell } from '@/components/shared/dialog-shell/dialog-form-shell';
import { cn } from '@/lib/utils';
import { UploadContextPanel } from './components/upload-context-panel';
import { UploadDropzoneArea } from './components/upload-dropzone-area';
import { useDocumentUpload } from './hooks/use-document-upload';
import { useFormularioStore } from '../../store/formulario-store';
import {
  ALLOWED_TYPES,
  MAX_FILE_SIZE,
  type DocumentUploadDropzoneProps,
} from './types';

/**
 * DocumentUploadDropzone - Componente de upload de documentos para assinatura digital
 *
 * Inspirado no protótipo SignFlow, adaptado à identidade visual Zattar.
 * Suporta PDF, DOCX e PNG até 10MB com validação robusta.
 *
 * Features:
 * - Layout split responsivo (painel de contexto + dropzone)
 * - Drag & drop com validação de tipo e tamanho
 * - Progress bar durante upload
 * - Integração com Supabase Storage via server action
 * - Feedback visual completo (loading, success, error)
 *
 * @example
 * ```tsx
 * <DocumentUploadDropzone
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onUploadSuccess={(url, name) => console.log('Uploaded:', url, name)}
 * />
 * ```
 */
export function DocumentUploadDropzone({
  open,
  onOpenChange,
  onUploadSuccess,
}: DocumentUploadDropzoneProps) {
  // Store do formulário para integração com fluxo multi-step
  const { setDadosContrato, proximaEtapa } = useFormularioStore();

  const {
    isUploading,
    progress,
    error,
    uploadedFile,
    selectedFile,
    selectFile,
    uploadFile,
    resetUpload,
    removeFile,
  } = useDocumentUpload({
    onSuccess: () => {
      toast.success('Documento enviado com sucesso!');
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  /**
   * Handler para quando arquivos são dropados ou selecionados
   */
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        selectFile(file);
      }
    },
    [selectFile]
  );

  /**
   * Handler para rejeição de arquivos (tipo inválido, tamanho excedido)
   */
  const onDropRejected = useCallback((fileRejections: FileRejection[]) => {
    const rejection = fileRejections[0];
    if (!rejection) return;

    const errorCode = rejection.errors[0]?.code;
    if (errorCode === 'file-too-large') {
      toast.error('Arquivo muito grande. O limite é 10MB.');
    } else if (errorCode === 'file-invalid-type') {
      toast.error('Tipo de arquivo não suportado. Use PDF, DOCX ou PNG.');
    } else {
      toast.error('Erro ao processar o arquivo.');
    }
  }, []);

  // useDropzone retorna a função 'open' que abre o file picker programaticamente
  const { getRootProps, getInputProps, isDragActive, open: openFilePicker } =
    useDropzone({
      onDrop,
      onDropRejected,
      accept: ALLOWED_TYPES,
      maxSize: MAX_FILE_SIZE,
      maxFiles: 1,
      multiple: false,
      disabled: isUploading,
      noClick: false, // Permite click na área do dropzone
      noKeyboard: false,
    });

  /**
   * Abre o file picker quando o botão é clicado
   */
  const handleSelectFile = useCallback(() => {
    openFilePicker();
  }, [openFilePicker]);

  /**
   * Salva dados no store e avança para próxima etapa
   */
  const saveAndAdvance = useCallback(
    (url: string, name: string) => {
      // Salva URL e nome do documento no store (Partial aceita apenas os campos necessários)
      setDadosContrato({
        documentoUrl: url,
        documentoNome: name,
      });

      // Callback externo para componente pai
      onUploadSuccess?.(url, name);

      // Fecha modal e reseta estado local
      onOpenChange(false);
      resetUpload();

      // Avança para próxima etapa do formulário
      proximaEtapa();
    },
    [setDadosContrato, onUploadSuccess, onOpenChange, resetUpload, proximaEtapa]
  );

  /**
   * Handler para continuar após upload
   */
  const handleContinue = useCallback(async () => {
    if (uploadedFile) {
      // Arquivo já foi uploaded, apenas continua
      saveAndAdvance(uploadedFile.url, uploadedFile.name);
      return;
    }

    if (selectedFile) {
      // Faz upload do arquivo selecionado
      const result = await uploadFile();
      if (result) {
        saveAndAdvance(result.url, result.name);
      }
    }
  }, [uploadedFile, selectedFile, uploadFile, saveAndAdvance]);

  /**
   * Handler para cancelar e resetar
   */
  const handleCancel = useCallback(() => {
    resetUpload();
    onOpenChange(false);
  }, [resetUpload, onOpenChange]);

  const canContinue = (selectedFile || uploadedFile) && !isUploading;

  return (
    <DialogFormShell
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleCancel();
        } else {
          onOpenChange(isOpen);
        }
      }}
      title="Upload de Documento"
      description="Envie o documento que será assinado digitalmente"
      maxWidth="4xl"
      multiStep={{
        current: 1,
        total: 5,
        stepTitle: 'Upload do Documento',
      }}
      footer={
        <Button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue}
          className={cn(
            'bg-primary text-white hover:bg-primary/90',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isUploading ? 'Enviando...' : 'Continuar'}
        </Button>
      }
    >
      <div className="p-6">
        {/* Layout split responsivo */}
        <div
          className={cn(
            'grid gap-6 lg:gap-8',
            'grid-cols-1 lg:grid-cols-12',
            'min-h-125'
          )}
        >
          {/* Painel de contexto (lado esquerdo) */}
          <div className="lg:col-span-5">
            <UploadContextPanel
              onSelectFile={handleSelectFile}
              isUploading={isUploading}
            />
          </div>

          {/* Área de dropzone (lado direito) */}
          <div className="lg:col-span-7">
            <UploadDropzoneArea
              isDragActive={isDragActive}
              hasError={!!error}
              errorMessage={error?.message}
              selectedFile={selectedFile}
              uploadedFile={uploadedFile}
              isUploading={isUploading}
              progress={progress}
              onRemoveFile={removeFile}
              getRootProps={getRootProps}
              getInputProps={getInputProps}
            />
          </div>
        </div>
      </div>
    </DialogFormShell>
  );
}
