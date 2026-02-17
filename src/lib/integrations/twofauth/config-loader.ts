/**
 * Config Loader - 2FAuth
 * Carrega configuração do banco de dados
 */

import { createClient } from "@/lib/supabase/server";
import type { TwoFAuthConfig } from "./types";

/**
 * Busca configuração do 2FAuth do banco de dados
 */
export async function load2FAuthConfig(): Promise<TwoFAuthConfig | null> {
  try {
    const supabase = await createClient();

    // Buscar integração 2FAuth ativa
    const { data, error } = await supabase
      .from("integracoes")
      .select("configuracao")
      .eq("tipo", "twofauth")
      .eq("ativo", true)
      .single();

    if (!error && data?.configuracao) {
      const config = data.configuracao as Record<string, unknown>;

      // Validar estrutura básica
      if (
        typeof config.api_url === "string" &&
        typeof config.api_token === "string"
      ) {
        return {
          apiUrl: config.api_url,
          token: config.api_token,
          accountId: typeof config.account_id === "number" ? config.account_id.toString() : undefined,
        };
      }
    }
  } catch (error) {
    console.error("Erro ao carregar configuração 2FAuth do banco:", error);
  }

  return null;
}
