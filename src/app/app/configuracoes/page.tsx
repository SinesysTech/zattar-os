import { Suspense } from "react";
import { redirect } from "next/navigation";

import { actionObterMetricasDB } from "@/features/admin";
import { actionListarIntegracoesPorTipo } from "@/features/integracoes";
import { ConfiguracoesTabsContent } from "./components/configuracoes-tabs-content";

export default async function ConfiguracoesPage() {
  const [metricasResult, integracoesResult] = await Promise.all([
    actionObterMetricasDB(),
    actionListarIntegracoesPorTipo({ tipo: "twofauth" }),
  ]);

  if (!metricasResult.success) {
    if (metricasResult.error?.includes("Acesso negado")) {
      redirect("/app/dashboard");
    }

    return (
      <div className="text-red-600">{metricasResult.error || "Erro ao carregar configurações"}</div>
    );
  }

  // Buscar integração 2FAuth (primeira ativa ou primeira encontrada)
  let integracao2FAuth = null;
  if (integracoesResult.success && Array.isArray(integracoesResult.data)) {
    integracao2FAuth = integracoesResult.data.find((i) => i.ativo) || integracoesResult.data[0] || null;
  }

  return (
    <Suspense>
      <ConfiguracoesTabsContent
        metricas={metricasResult.data}
        integracao2FAuth={integracao2FAuth}
      />
    </Suspense>
  );
}
