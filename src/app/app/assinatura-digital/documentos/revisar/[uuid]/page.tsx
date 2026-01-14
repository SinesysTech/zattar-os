import { Suspense } from "react";
import { PageShell } from "@/components/shared/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { RevisarDocumentoClient } from "./client-page";

export const metadata = {
  title: "Revisar Documento | Assinatura Digital",
  description: "Revisar documento antes de enviar para assinatura",
};

interface PageProps {
  params: Promise<{ uuid: string }>;
}

export default async function RevisarDocumentoPage({ params }: PageProps) {
  const { uuid } = await params;

  return (
    <PageShell>
      <Suspense
        fallback={
          <div className="space-y-6">
            <Skeleton className="h-12 w-full" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Skeleton className="h-[200px] w-full" />
                <Skeleton className="h-[300px] w-full" />
              </div>
              <Skeleton className="h-[600px] w-full" />
            </div>
          </div>
        }
      >
        <RevisarDocumentoClient uuid={uuid} />
      </Suspense>
    </PageShell>
  );
}
