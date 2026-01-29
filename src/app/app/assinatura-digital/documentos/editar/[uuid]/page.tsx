import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";
import { EditarDocumentoClient } from "./client-page";
import { SignatureFlowShell } from "../../components/signature-flow-shell";

export const metadata: Metadata = {
  title: "Configurar Âncoras | Assinatura Digital",
  description: "Configurar posições das assinaturas no documento",
};

interface PageProps {
  params: Promise<{ uuid: string }>;
}

export default async function EditarDocumentoPage({ params }: PageProps) {
  const { uuid } = await params;

  return (
    <SignatureFlowShell mode="fullscreen">
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center">
            <Skeleton className="h-full w-full" />
          </div>
        }
      >
        <EditarDocumentoClient uuid={uuid} />
      </Suspense>
    </SignatureFlowShell>
  );
}
