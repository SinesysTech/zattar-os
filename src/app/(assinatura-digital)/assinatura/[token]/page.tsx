import { PageShell } from "@/components/shared/page-shell";
import { AssinaturaPublicaClient } from "./page-client";

export const dynamic = "force-dynamic";

export default async function AssinaturaPublicaPage() {
  return (
    <PageShell>
      <AssinaturaPublicaClient />
    </PageShell>
  );
}



