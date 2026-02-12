/**
 * Script de teste direto para audienciasCapture no TRT3
 * Executa o serviço diretamente (sem passar pela API HTTP) para ver logs e erros reais.
 */

import { config } from "dotenv";
import { resolve } from "path";

// Carregar .env.local
config({ path: resolve(process.cwd(), ".env.local") });

import { audienciasCapture } from "@/features/captura/services/trt/audiencias.service";
import type { CapturaAudienciasParams } from "@/features/captura/services/trt/trt-capture.service";

// Mock de dados para TRT3
const MOCK_PARAMS: CapturaAudienciasParams = {
  credential: {
    username: process.env.PJE_USERNAME || "",
    password: process.env.PJE_PASSWORD || "",
  },
  config: {
    codigo: "TRT3",
    nome: "TRT da 3ª Região",
    url: "https://pje.trt3.jus.br/pje/login.seam", // URL base aproximada, o auth service resolve
    grau: "primeiro_grau",
    estado: "MG",
  },
  // Se precisar de 2FA, configure aqui ou deixe undefined se não usar
  twofauthConfig: process.env.TWOFAUTH_API_KEY
    ? {
        apiKey: process.env.TWOFAUTH_API_KEY,
        siteName: "PJE-TRT3",
      }
    : undefined,

  // Datas para busca (opcional)
  dataInicio: new Date().toISOString().split("T")[0],
  // dataFim default é +1 ano
};

async function run() {
  console.log("🚀 Iniciando teste direto de audienciasCapture (TRT3)...");

  if (!MOCK_PARAMS.credential.username || !MOCK_PARAMS.credential.password) {
    console.error("❌ Erro: Credenciais PJe não encontradas no .env.local");
    process.exit(1);
  }

  try {
    const start = Date.now();
    const result = await audienciasCapture(MOCK_PARAMS);
    const end = Date.now();

    console.log("\n✅ Sucesso!");
    console.log(`⏱️ Duração: ${(end - start) / 1000}s`);
    console.log(`📊 Total audiências: ${result.total}`);

    if (result.persistencia) {
      console.log("💾 Persistência:", result.persistencia);
    }

    if (result.dadosComplementares) {
      console.log("📈 Dados Complementares:", result.dadosComplementares);
    }
  } catch (error) {
    console.error("\n❌ Erro fatal:", error);
  }
}

run();
