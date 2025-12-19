import { Suspense } from "react";
import { PageShell } from "@/components/shared/page-shell";
import { AssinaturaDigitalTabsContent } from "@/features/assinatura-digital/components/assinatura-digital-tabs-content";
import { TemplatesClient } from "./templates/client-page";
import { FormulariosClient } from "./formularios/client-page";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

export default function AssinaturaDigitalPage() {
  return (
    <PageShell
      title="Assinatura Digital"
      description="Gerencie templates, formularios e fluxos de assinatura digital."
    >
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-96 w-full" />
          </div>
        }
      >
        <AssinaturaDigitalTabsContent
          templatesContent={<TemplatesClient />}
          formulariosContent={<FormulariosClient />}
        />
      </Suspense>
    </PageShell>
  );
}
