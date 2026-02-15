import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';
import { PageShell } from "@/components/shared/page-shell";
import { actionObterMetricasDB } from "@/features/admin";
import { ConfiguracoesTabsContent } from "./components/configuracoes-tabs-content";

export default async function ConfiguracoesPage() {
  const result = await actionObterMetricasDB();

  if (!result.success) {
    if (result.error?.includes("Acesso negado")) {
      redirect("/app/dashboard");
    }

    return (
      <PageShell title="Configurações">
        <div className="text-red-600">{result.error || "Erro ao carregar configurações"}</div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Configurações">
      <ConfiguracoesTabsContent metricas={result.data} />
    </PageShell>
  );
}
