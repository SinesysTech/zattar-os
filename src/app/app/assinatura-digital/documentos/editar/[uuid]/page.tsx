import { Suspense } from "react";
import type { Metadata } from "next";
import { EditarDocumentoClient } from "./client-page";
import { SignatureFlowShell } from "../../components/signature-flow-shell";

export const metadata: Metadata = {
  title: "Configurar Âncoras | Assinatura Digital",
  description: "Configurar posições das assinaturas no documento",
};

export default async function EditarDocumentoPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;

  console.log(`[EditarDocumentoPage] Iniciando renderização para UUID: ${uuid}`);

  return (
    <SignatureFlowShell mode="fullscreen">
      <Suspense fallback={
        <div className="flex h-screen w-full items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Carregando editor...</p>
          </div>
        </div>
      }>
        <EditarDocumentoClient uuid={uuid} />
      </Suspense>
    </SignatureFlowShell>
  );
}
