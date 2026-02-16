import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/shared/page-shell";
import { actionListDocumentos } from "../../feature";
import { DocumentosTableWrapper } from "./client-page";

export const metadata = {
  title: "Documentos de Assinatura Digital | Zattar Advogados",
  description: "Lista de documentos enviados para assinatura digital",
};

function DocumentosLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <div className="grid gap-4 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}

export default async function ListaDocumentosPage() {
  // Fetch inicial no server
  const resultado = await actionListDocumentos({
    page: 1,
    pageSize: 200,
  });

  const initialData =
    resultado.success && resultado.data && "documentos" in resultado.data
      ? (resultado.data as { documentos: unknown[] }).documentos
      : [];

  return (
    <PageShell>
      <Suspense fallback={<DocumentosLoading />}>
        <DocumentosTableWrapper
          initialData={initialData as Parameters<typeof DocumentosTableWrapper>[0]["initialData"]}
        />
      </Suspense>
    </PageShell>
  );
}
