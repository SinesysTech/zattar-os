import { Suspense } from "react";
import type { Metadata } from "next";
import { PageShell } from "@/components/shared/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { EditarDocumentoClient } from "./client-page";

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
    <PageShell>
      <Suspense
        fallback={
          <div className="space-y-6">
            <Skeleton className="h-12 w-full" />
            <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
              <Skeleton className="h-100 w-full" />
              <Skeleton className="h-150 w-full" />
            </div>
          </div>
        }
      >
        <EditarDocumentoClient uuid={uuid} />
      </Suspense>
    </PageShell>
  );
}
