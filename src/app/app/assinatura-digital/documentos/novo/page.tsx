import { Metadata } from "next";
import { UploadPageLayout } from "./components/upload-page-layout";
import { DocumentUploadDropzone } from "../../feature/components/upload/document-upload-dropzone";

export const metadata: Metadata = {
  title: "Novo Documento | Assinatura Digital",
  description: "Enviar documento para assinatura digital",
};

export const dynamic = "force-dynamic";

export default function NovoDocumentoPage() {
  return (
    <UploadPageLayout>
      <DocumentUploadDropzone />
    </UploadPageLayout>
  );
}
