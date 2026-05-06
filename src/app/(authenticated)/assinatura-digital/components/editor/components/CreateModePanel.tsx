'use client';

import { cn } from '@/lib/utils';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import CreateTemplateForm from '../CreateTemplateForm';
import { Heading, Text } from '@/components/ui/typography';

interface CreateModePanelUploadProps {
  onFileUpload: (file: File) => void;
}

interface CreateModePanelFormProps {
  uploadedFile: File;
  onSubmit: (data: {
    nome: string;
    descricao: string;
    conteudo_markdown?: string;
  }) => Promise<void>;
  onCancel: () => void;
}

/**
 * CreateModePanelUpload - Dropzone for initial PDF upload in create mode
 */
export function CreateModePanelUpload({ onFileUpload }: CreateModePanelUploadProps) {
  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    onFileUpload(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    multiple: false,
  });

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className={cn("flex-1 flex flex-col inline-loose items-center justify-center min-h-0 overflow-auto px-6 py-8")}>
        <div className={cn("max-w-2xl w-full stack-loose")}>
          {/* Dropzone compacto */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-input hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
            <Heading level="card" className={cn("text-body mb-1")}>
              {isDragActive ? 'Solte o arquivo aqui' : 'Faça upload do PDF do template'}
            </Heading>
            <p className={cn("text-body-sm text-muted-foreground mb-2")}>
              Arraste um arquivo PDF ou clique para selecionar
            </p>
            <Text variant="caption">Apenas arquivos PDF, máximo 10MB</Text>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * CreateModePanelForm - Form for template metadata after PDF upload
 */
export function CreateModePanelForm({
  uploadedFile,
  onSubmit,
  onCancel,
}: CreateModePanelFormProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className={cn("flex-1 flex flex-col inline-loose items-center justify-center min-h-0 overflow-auto px-6 py-8")}>
        <div className={cn("max-w-2xl w-full stack-loose")}>
          {/* Dropzone with preview */}
          <div className={cn("border-2 border-primary/50 rounded-lg inset-dialog text-center bg-primary/5")}>
            <Upload className="mx-auto h-10 w-10 text-primary mb-2" />
            <Heading level="card" className={cn("text-body-sm mb-1")}>PDF carregado com sucesso!</Heading>
            <Text variant="caption">
              {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
            </Text>
          </div>

          {/* Formulário inline */}
          <CreateTemplateForm
            pdfFile={uploadedFile}
            tipoTemplate="pdf"
            onSubmit={onSubmit}
            onCancel={onCancel}
          />
        </div>
      </div>
    </div>
  );
}

// Default export for backward compatibility
const CreateModePanel = { CreateModePanelUpload, CreateModePanelForm };
export default CreateModePanel;
