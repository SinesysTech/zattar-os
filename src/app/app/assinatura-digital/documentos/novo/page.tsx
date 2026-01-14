import { PageShell } from "@/components/shared/page-shell";
import { NovoDocumentoClient } from "./client-page";

export const metadata = {
  title: "Novo Documento | Assinatura Digital",
  description: "Enviar documento para assinatura digital",
};

export const dynamic = "force-dynamic";

export default function NovoDocumentoPage() {
  return (
    <PageShell
      title="Novo Documento para Assinatura"
      description="Envie um PDF e configure os assinantes para coletar assinaturas digitais"
    >
      <NovoDocumentoClient />
    </PageShell>
  );
}
