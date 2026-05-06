import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';
import {
  PageShell,
  PageHeader,
  PageHeaderTitle,
  PageContent,
} from "@/components/shared/page-shell";
import { actionObterMetricasDB } from "@/app/(authenticated)/admin";
import { MetricasDBContent } from "./components/metricas-db-content";

export default async function MetricasDBPage() {
  const result = await actionObterMetricasDB();

  if (!result.success) {
    if (result.error?.includes("Acesso negado")) {
      redirect("/app/dashboard");
    }

    return (
      <PageShell>
        <PageHeader>
          <PageHeaderTitle>Métricas do Banco de Dados</PageHeaderTitle>
        </PageHeader>
        <PageContent>
          <div className="text-destructive">{result.error || "Erro ao carregar métricas"}</div>
        </PageContent>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {result.data && <MetricasDBContent metricas={result.data} />}
    </PageShell>
  );
}
