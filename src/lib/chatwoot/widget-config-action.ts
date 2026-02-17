"use server";

/**
 * Server Action para retornar a configuração pública do widget Chatwoot.
 * Não requer autenticação pois é usado no site público.
 * Retorna apenas os campos públicos (websiteToken e widgetBaseUrl).
 */

import { getChatwootConfigFromDatabase as _getChatwootConfigFromDatabase } from "./config";

export interface WidgetConfig {
  websiteToken: string;
  baseUrl: string;
}

export async function actionObterChatwootWidgetConfig(): Promise<WidgetConfig | null> {
  try {
    const db = (await import("@/lib/supabase")).createDbClient();

    const { data, error } = await db
      .from("integracoes")
      .select("configuracao")
      .eq("tipo", "chatwoot")
      .eq("ativo", true)
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    const config = data.configuracao as Record<string, unknown>;
    const websiteToken = config.website_token as string | undefined;
    const widgetBaseUrl = config.widget_base_url as string | undefined;

    if (!websiteToken || !widgetBaseUrl) return null;

    return {
      websiteToken,
      baseUrl: (widgetBaseUrl as string).replace(/\/$/, ""),
    };
  } catch (error) {
    console.error("[Chatwoot Widget Config] Erro:", error);
    return null;
  }
}
