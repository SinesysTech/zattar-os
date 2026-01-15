"use client";

import { useCallback } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { UploadDropzoneArea } from "./components/upload-dropzone-area";
import { useDocumentUpload } from "./hooks/use-document-upload";
import { useFormularioStore } from "../../store/formulario-store";
import { actionCreateDocumento } from "../../actions/documentos-actions";
import {
  ALLOWED_TYPES,
  MAX_FILE_SIZE,
} from "./types";

/**
 * DocumentUploadDropzone - Componente de página de upload (Passo 1)
 *
 * Layout split screen onde o usuário faz o upload do documento inicial.
 * Após upload bem sucedido, cria o documento no banco e redireciona para edição.
 */
export interface DocumentUploadDropzoneProps {
  onUploadSuccess?: (url: string, name: string) => void;
}

export function DocumentUploadDropzone({ onUploadSuccess }: DocumentUploadDropzoneProps = {}) {
  const router = useRouter();
  const { setEtapaAtual } = useFormularioStore();

  const handleUploadCompleted = useCallback(async (url: string, name: string) => {
    // Se houver callback externo, delegar e não criar documento automaticamente
    if (onUploadSuccess) {
      onUploadSuccess(url, name);
      return;
    }

    try {
      toast.loading("Processando documento...", { id: "create-doc" });

      const result = await actionCreateDocumento({
        titulo: name,
        pdf_original_url: url,
        selfie_habilitada: false,
        assinantes: [],
      });

      console.log("[DEBUG] actionCreateDocumento result:", JSON.stringify(result, null, 2));

      // Verificar se houve erro na action
      if (!result.success) {
        throw new Error(result.error || result.message || "Erro desconhecido ao criar documento");
      }

      // @ts-expect-error - TODO: Fix typing for action result
      if (!result?.data?.documento?.documento_uuid) {
        throw new Error("Documento criado mas UUID não retornado");
      }

      toast.success("Documento enviado! Redirecionando para configuração...", { id: "create-doc" });

      // Avança para etapa de configuração
      setEtapaAtual(1);

      // Redireciona para o editor
      // @ts-expect-error - TODO: Fix typing for action result
      router.push(`/app/assinatura-digital/documentos/editar/${result.data.documento.documento_uuid}`);
    } catch (error) {
      console.error("[DEBUG] Erro ao criar documento:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao processar documento";
      toast.error(errorMessage, { id: "create-doc" });
    }
  }, [router, setEtapaAtual, onUploadSuccess]);

  const {
    isUploading,
    progress,
    error,
    uploadedFile,
    selectedFile,
    selectFile,
    removeFile,
    uploadFile,
    resetUpload,
  } = useDocumentUpload({
    onSuccess: () => { },
    onError: (err) => toast.error(err.message),
  });

  const autoUpload = useCallback(async () => {
    const result = await uploadFile();
    if (result) {
      await handleUploadCompleted(result.url, result.name);
    }
  }, [uploadFile, handleUploadCompleted]);

  // Handler para Drop
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];

        // Atualiza UI com o arquivo selecionado
        selectFile(file);

        // Inicia upload automaticamente
        const result = await uploadFile(file);

        if (result) {
          await handleUploadCompleted(result.url, result.name);
        }
      }
    },
    [selectFile, uploadFile, handleUploadCompleted],
  );

  // Dropzone setup
  const onDropRejected = useCallback((fileRejections: FileRejection[]) => {
    const rejection = fileRejections[0];
    if (!rejection) return;

    const errorCode = rejection.errors[0]?.code;
    if (errorCode === "file-too-large") {
      toast.error("Arquivo muito grande. O limite é 10MB.");
    } else if (errorCode === "file-invalid-type") {
      toast.error("Tipo de arquivo não suportado. Use PDF, DOCX ou PNG.");
    } else {
      toast.error("Erro ao processar o arquivo.");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } =
    useDropzone({
      onDrop,
      onDropRejected,
      accept: ALLOWED_TYPES,
      maxSize: MAX_FILE_SIZE,
      maxFiles: 1,
      multiple: false,
      disabled: isUploading,
      noClick: false, // Importante: click manual controlado
      noKeyboard: true,
    });

  // Effect para Auto-Upload
  // Precisamos garantir que o hook já atualizou o 'selectedFile' interno.
  // Se selectFile atualiza state, ele vai triggerar re-render.
  // Nesse novo render, selectedFile estará populado.
  // Ai chamamos uploadFile().

  // Mas uploadFile é async.

  // Melhor: modificar o useDocumentUpload? User disse "Trust the files".
  // Vou usar useEffect.

  return (
    <div className="flex h-full w-full flex-1 flex-col items-center justify-center p-6 lg:p-12 animate-fade-in overflow-hidden">
      <div className="relative w-full max-w-5xl flex flex-col items-center justify-center -mt-16">
        <UploadDropzoneArea
          isDragActive={isDragActive}
          hasError={!!error}
          errorMessage={error?.message}
          selectedFile={selectedFile}
          uploadedFile={uploadedFile}
          isUploading={isUploading}
          progress={progress}
          onRemoveFile={() => {
            removeFile();
            resetUpload();
          }}
          getRootProps={getRootProps}
          getInputProps={getInputProps}
        />

        {/* Botão de Confirmação Manual caso o auto-upload seja arriscado OU se o design pedir */}
        {/* O plano não pede botão explícito de "Enviar" na tela de upload, implica fluxo direto */}
        {/* Mas vamos adicionar um botão "Enviar" caso o arquivo esteja selecionado mas não upado (estado de preview) */}
        {selectedFile && !isUploading && !uploadedFile && (
          <div className="mt-8 flex justify-center animate-fade-in-up">
            <button
              onClick={autoUpload}
              className="bg-primary text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              Confirmar e Enviar Documento
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
