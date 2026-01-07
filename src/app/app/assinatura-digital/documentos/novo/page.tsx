import { PageShell } from "@/components/shared/page-shell";
import { DocumentosClient } from "../client-page";

export const dynamic = "force-dynamic";

export default function NovoDocumentoPage() {
  return (
    <PageShell>
      <DocumentosClient />
    </PageShell>
  );
}
