import { Suspense } from "react";
import { EditarDocumentoClient } from "./client-page";

export const metadata = {
  title: "Editar Documento de Assinatura | Zattar Advogados",
  description: "Editar documento de assinatura digital",
};

interface PageProps {
  params: Promise<{ uuid: string }>;
}

export default async function EditarDocumentoPage({ params }: PageProps) {
  const { uuid } = await params;

  return (
    <Suspense fallback={<div className="p-8">Carregando documento...</div>}>
      <EditarDocumentoClient uuid={uuid} />
    </Suspense>
  );
}
