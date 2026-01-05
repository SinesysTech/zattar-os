import { PageShell } from "@/components/shared/page-shell";
import { AssinaturaPublicaClient } from "./page-client";

export const dynamic = "force-dynamic";

export default async function AssinaturaPublicaPage() {
  return (
    <PageShell
      title="Assinatura Digital"
      description="Confirme seus dados e assine o documento."
    >
      <AssinaturaPublicaClient />
    </PageShell>
  );
}



