import { Suspense } from "react";
import { PageShell } from "@/components/shared/page-shell";
import { AssinaturaDigitalTabsContent } from "@/features/assinatura-digital";
import { TemplatesClient } from "./templates/client-page";
import { FormulariosClient } from "./formularios/client-page";
import { ListaDocumentosClient } from "./documentos/lista/client-page";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

export default function AssinaturaDigitalPage() {
  return (
    <PageShell>
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-96 w-full" />
          </div>
        }
      >
        <AssinaturaDigitalTabsContent
          documentosContent={<ListaDocumentosClient />}
          templatesContent={<TemplatesClient />}
          formulariosContent={<FormulariosClient />}
        />
      </Suspense>
    </PageShell>
  );
}
