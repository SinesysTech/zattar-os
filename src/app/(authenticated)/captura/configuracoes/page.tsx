import { redirect } from "next/navigation";

import { actionObterMetricasDB } from "@/app/(authenticated)/admin";
import { actionListarIntegracoesPorTipo } from "@/lib/integracoes";
import { actionListarSystemPrompts } from "@/lib/system-prompts";
import { ConfiguracoesSettingsLayout } from "@/app/(authenticated)/configuracoes/components/configuracoes-settings-layout";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const [metricasResult, integracoes2FAuthResult, integracoesChatwootResult, integracoesDyteResult, integracoesEditorIAResult, systemPromptsResult] = await Promise.all([
    actionObterMetricasDB(),
    actionListarIntegracoesPorTipo({ tipo: "twofauth" }),
    actionListarIntegracoesPorTipo({ tipo: "chatwoot" }),
    actionListarIntegracoesPorTipo({ tipo: "dyte" }),
    actionListarIntegracoesPorTipo({ tipo: "editor_ia" }),
    actionListarSystemPrompts(),
  ]);

  if (!metricasResult.success) {
    if (metricasResult.error?.includes("Acesso negado")) {
      redirect("/app/dashboard");
    }

    return (
      <div className="text-red-600">{metricasResult.error || "Erro ao carregar configurações"}</div>
    );
  }

  let integracao2FAuth = null;
  if (integracoes2FAuthResult.success && Array.isArray(integracoes2FAuthResult.data)) {
    integracao2FAuth = integracoes2FAuthResult.data.find((i) => i.ativo) || integracoes2FAuthResult.data[0] || null;
  }

  let integracaoChatwoot = null;
  if (integracoesChatwootResult.success && Array.isArray(integracoesChatwootResult.data)) {
    integracaoChatwoot = integracoesChatwootResult.data.find((i) => i.ativo) || integracoesChatwootResult.data[0] || null;
  }

  let integracaoDyte = null;
  if (integracoesDyteResult.success && Array.isArray(integracoesDyteResult.data)) {
    integracaoDyte = integracoesDyteResult.data.find((i) => i.ativo) || integracoesDyteResult.data[0] || null;
  }

  let integracaoEditorIA = null;
  if (integracoesEditorIAResult.success && Array.isArray(integracoesEditorIAResult.data)) {
    integracaoEditorIA = integracoesEditorIAResult.data.find((i) => i.ativo) || integracoesEditorIAResult.data[0] || null;
  }

  const systemPrompts = systemPromptsResult.success && Array.isArray(systemPromptsResult.data)
    ? systemPromptsResult.data
    : [];

  return (
    <ConfiguracoesSettingsLayout
      metricas={metricasResult.data}
      integracao2FAuth={integracao2FAuth}
      integracaoChatwoot={integracaoChatwoot}
      integracaoDyte={integracaoDyte}
      integracaoEditorIA={integracaoEditorIA}
      systemPrompts={systemPrompts}
    />
  );
}
