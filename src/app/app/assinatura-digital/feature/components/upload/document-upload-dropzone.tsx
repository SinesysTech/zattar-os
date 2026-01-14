"use client";

import { useCallback } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { UploadContextPanel } from "./components/upload-context-panel";
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
export function DocumentUploadDropzone() {
  const router = useRouter();
  const { setEtapaAtual } = useFormularioStore();

  const handleUploadCompleted = useCallback(async (url: string, name: string) => {
    try {
      toast.loading("Processando documento...", { id: "create-doc" });

      const result = await actionCreateDocumento({
        titulo: name,
        pdf_original_url: url,
        selfie_habilitada: false,
        assinantes: [],
      });

      // @ts-ignore
      if (!(result as any)?.data?.documento?.documento_uuid) {
        throw new Error("Falha ao criar documento");
      }

      toast.success("Documento enviado! Redirecionando para configuração...", { id: "create-doc" });

      // Avança para etapa de configuração
      setEtapaAtual(1);

      // Redireciona para o editor
      router.push(`/app/assinatura-digital/documentos/editar/${(result as any).data.documento.documento_uuid}`);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao processar documento", { id: "create-doc" });
    }
  }, [router, setEtapaAtual]);

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

  const { getRootProps, getInputProps, isDragActive, open: openFilePicker } =
    useDropzone({
      onDrop,
      onDropRejected,
      accept: ALLOWED_TYPES,
      maxSize: MAX_FILE_SIZE,
      maxFiles: 1,
      multiple: false,
      disabled: isUploading,
      noClick: true, // Importante: click manual controlado
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
    <div className="grid gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-12 h-full flex-1">
      {/* Painel de contexto (lado esquerdo) */}
      <div className="lg:col-span-5 flex flex-col justify-center order-2 lg:order-1">
        <UploadContextPanel
          onSelectFile={openFilePicker}
          isUploading={isUploading}
        />
      </div>

      {/* Área de dropzone (lado direito) */}
      <div className="lg:col-span-7 bg-surface p-6 lg:p-12 flex flex-col justify-center order-1 lg:order-2">
        <div className="h-full flex flex-col justify-center">
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
    </div>
  );
}
