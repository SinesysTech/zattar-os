import { cn } from '@/lib/utils';
import { Suspense } from "react";
import type { Metadata } from "next";
import { PageShell } from "@/components/shared/page-shell";
import { EditarDocumentoClient } from "./client-page";

export const metadata: Metadata = {
  title: "Configurar Documento | Assinatura Digital",
  description: "Configurar assinantes e posições das assinaturas no documento",
};

export default async function EditarDocumentoPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;

  return (
    <PageShell>
      <Suspense fallback={
        <div className="flex h-96 w-full items-center justify-center">
          <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex flex-col items-center gap-2")}>
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ "text-sm text-muted-foreground")}>Carregando editor...</p>
          </div>
        </div>
      }>
        <EditarDocumentoClient uuid={uuid} />
      </Suspense>
    </PageShell>
  );
}
