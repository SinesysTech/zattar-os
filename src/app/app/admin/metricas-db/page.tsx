import { redirect } from "next/navigation";
import { PageShell } from "@/components/shared/page-shell";
import { actionObterMetricasDB } from "@/features/admin";
import { MetricasDBContent } from "./components/metricas-db-content";

export default async function MetricasDBPage() {
  const result = await actionObterMetricasDB();

  if (!result.success) {
    if (result.error?.includes("Acesso negado")) {
      redirect("/app/dashboard");
    }

    return (
      <PageShell title="Métricas do Banco de Dados" description="Erro ao carregar">
        <div className="text-red-600">{result.error || "Erro ao carregar métricas"}</div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Métricas do Banco de Dados"
      description="Monitoramento de performance e saúde do PostgreSQL"
    >
      {result.data && <MetricasDBContent metricas={result.data} />}
    </PageShell>
  );
}
